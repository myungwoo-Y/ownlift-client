import type { SetLogRecord, WorkoutResultRecord } from "@ownlift/db";
import { getSetLogsBySession, getWorkoutResultBySession, getWorkoutResultsByInstance } from "@ownlift/db";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { borderRadius, Button, colors, fontSize, fontWeight, motion, spacing, Text } from "../../src/design";
import { formatMeasurement, getSessionEstimatedOneRepMax } from "../../src/history/history-screen/utils";
import { formatNumber, getLiftLabel, t, useLocale } from "../../src/i18n";
import { useProgramStore } from "../../src/stores/program-store";

type DeltaTone = "negative" | "neutral" | "positive";

function RevealView({
  children,
  delay = 0,
  style,
}: {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      delay,
      withTiming(1, {
        duration: motion.duration.normal,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [delay, progress]);

  const revealStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: motion.distance.normal * (1 - progress.value) },
    ],
  }));

  return <Animated.View style={[style, revealStyle]}>{children}</Animated.View>;
}

function ResultCard({
  label,
  value,
  detail,
  detailTone = "neutral",
  reward = false,
}: {
  label: string;
  value: string;
  detail?: string | null;
  detailTone?: DeltaTone;
  reward?: boolean;
}) {
  const glowProgress = useSharedValue(0);

  useEffect(() => {
    if (!reward) {
      cancelAnimation(glowProgress);
      glowProgress.value = 0;
      return;
    }

    glowProgress.value = withRepeat(
      withTiming(1, {
        duration: 1100,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );

    return () => {
      cancelAnimation(glowProgress);
    };
  }, [glowProgress, reward]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: reward ? 0.12 + glowProgress.value * 0.18 : 0,
  }));

  return (
    <View style={[styles.card, reward ? styles.cardReward : null]}>
      {reward ? <Animated.View pointerEvents="none" style={[styles.cardRewardGlow, glowStyle]} /> : null}
      <Text variant="label" style={styles.cardLabel}>
        {label}
      </Text>
      <Text adjustsFontSizeToFit minimumFontScale={0.86} numberOfLines={1} style={styles.cardValue}>
        {value}
      </Text>
      {detail ? (
        <Text
          style={[
            styles.cardDetail,
            detailTone === "positive"
              ? styles.detailPositive
              : detailTone === "negative"
                ? styles.detailNegative
                : styles.detailNeutral,
          ]}
        >
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

function TopSetHero({
  value,
  detail,
  detailTone,
}: {
  value: string;
  detail: string;
  detailTone: DeltaTone;
}) {
  return (
    <View style={styles.topSetHero}>
      <Text variant="label" style={styles.cardLabel}>
        {t("workout.completeScreen.topSet")}
      </Text>
      <Text adjustsFontSizeToFit minimumFontScale={0.84} numberOfLines={1} style={styles.topSetValue}>
        {value}
      </Text>
      <View
        style={[
          styles.topSetDetailPill,
          detailTone === "positive"
            ? styles.topSetAchievementPill
            : detailTone === "negative"
              ? styles.topSetMissPill
              : styles.topSetNeutralPill,
        ]}
      >
        <Text
          style={[
            styles.topSetDetailText,
            detailTone === "positive"
              ? styles.detailPositive
              : detailTone === "negative"
                ? styles.detailNegative
                : styles.detailNeutral,
          ]}
        >
          {detail}
        </Text>
      </View>
    </View>
  );
}

function getTopSetSummary(logs: SetLogRecord[], unit: string): {
  value: string;
  detail: string;
  detailTone: DeltaTone;
} {
  const workLogs = logs
    .filter((log) => log.isCompleted && (log.setType === "work" || log.setType === "amrap"))
    .sort((a, b) => a.setOrder - b.setOrder);
  const amrapLog = workLogs.find((log) => log.setType === "amrap");
  const topSet = amrapLog ?? workLogs[workLogs.length - 1] ?? null;

  if (!topSet) {
    return {
      value: t("workout.completeScreen.noTopSet"),
      detail: t("workout.completeScreen.noTopSetDetail"),
      detailTone: "neutral",
    };
  }

  const weight = topSet.actualWeight ?? topSet.planned?.targetWeight ?? null;
  const reps = topSet.actualReps ?? topSet.planned?.targetReps ?? null;
  const targetReps = topSet.planned?.targetReps ?? null;

  const value = weight != null && reps != null
    ? `${formatNumber(weight, { maximumFractionDigits: 1 })}${unit} × ${formatNumber(reps)}`
    : t("workout.completeScreen.noTopSet");

  if (reps == null || targetReps == null) {
    return {
      value,
      detail: t("workout.completeScreen.noTopSetDetail"),
      detailTone: "neutral",
    };
  }

  const delta = reps - targetReps;
  if (delta > 0) {
    return {
      value,
      detail: t("workout.completeScreen.targetRepsAbove", { count: formatNumber(delta) }),
      detailTone: "positive",
    };
  }

  if (delta < 0) {
    return {
      value,
      detail: t("workout.completeScreen.targetRepsBelow", { count: formatNumber(Math.abs(delta)) }),
      detailTone: "negative",
    };
  }

  return {
    value,
    detail: t("workout.completeScreen.targetRepsMet"),
    detailTone: "neutral",
  };
}

export default function WorkoutCompleteScreen() {
  useLocale();

  const params = useLocalSearchParams<{ sessionId?: string | string[] }>();
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;
  const router = useRouter();
  const { instance, stubs, nextStub, loadProgram } = useProgramStore();

  const [result, setResult] = useState<WorkoutResultRecord | null>(null);
  const [logs, setLogs] = useState<SetLogRecord[]>([]);
  const [previousEstimatedPr, setPreviousEstimatedPr] = useState<number | null>(null);

  const stub = stubs.find((item) => item.sessionId === sessionId);
  const upcomingStub = nextStub && nextStub.sessionId !== sessionId ? nextStub : null;

  useEffect(() => {
    void loadProgram();
  }, [loadProgram]);

  useEffect(() => {
    let isCancelled = false;

    async function loadSummary() {
      if (!sessionId) {
        return;
      }

      const [nextResult, nextLogs] = await Promise.all([
        getWorkoutResultBySession(sessionId),
        getSetLogsBySession(sessionId),
      ]);

      if (isCancelled) {
        return;
      }

      setResult(nextResult);
      setLogs(nextLogs);
    }

    void loadSummary();

    return () => {
      isCancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    let isCancelled = false;

    async function loadPreviousPr() {
      if (!instance?.instanceId || !sessionId || !stub || !result?.completedAt) {
        setPreviousEstimatedPr(null);
        return;
      }

      const allResults = await getWorkoutResultsByInstance(instance.instanceId);
      const priorSameLiftResults = allResults.filter((item) => {
        if (item.sessionId === sessionId || item.completedAt >= result.completedAt) {
          return false;
        }

        const resultStub = stubs.find((candidate) => candidate.sessionId === item.sessionId);
        return resultStub?.mainLiftKey === stub.mainLiftKey;
      });

      const estimates = await Promise.all(
        priorSameLiftResults.map(async (item) => getSessionEstimatedOneRepMax(
          await getSetLogsBySession(item.sessionId),
        )),
      );
      const bestEstimate = estimates.reduce<number | null>((best, estimate) => {
        if (estimate == null) return best;
        return best == null || estimate > best ? estimate : best;
      }, null);

      if (!isCancelled) {
        setPreviousEstimatedPr(bestEstimate);
      }
    }

    void loadPreviousPr();

    return () => {
      isCancelled = true;
    };
  }, [instance?.instanceId, result?.completedAt, sessionId, stub, stubs]);

  const goToPlan = () => {
    try {
      if (router.canDismiss()) {
        router.dismissTo("/(tabs)/plan");
        return;
      }

      if (router.canGoBack()) {
        router.back();
        return;
      }

      router.replace("/(tabs)/plan");
    } catch {
      router.replace("/(tabs)/plan");
    }
  };

  const viewSessionLog = () => {
    if (!sessionId) {
      goToPlan();
      return;
    }

    router.replace({
      pathname: "/session/[sessionId]",
      params: { sessionId },
    });
  };

  const unit = instance?.params.unit ?? "kg";
  const estimatedPr = useMemo(() => getSessionEstimatedOneRepMax(logs), [logs]);
  const topSetSummary = useMemo(() => getTopSetSummary(logs, unit), [logs, unit]);
  const liftLabel = stub ? getLiftLabel(stub.mainLiftKey) : null;
  const estimatedPrValue = estimatedPr != null
    ? formatMeasurement(estimatedPr, unit)
    : t("workout.completeScreen.estimatedPrEmpty");
  const previousGap = estimatedPr != null && previousEstimatedPr != null
    ? estimatedPr - previousEstimatedPr
    : null;
  const hasPrReward = previousGap != null && previousGap > 0;
  const prDetail = hasPrReward && previousGap != null
    ? t("workout.completeScreen.prImproved", {
      value: `+${formatMeasurement(previousGap, unit)}`,
    })
    : null;
  const cycleStubs = stub
    ? stubs.filter((item) => item.cycleIndex === stub.cycleIndex)
    : [];
  const cycleCompletedCount = cycleStubs.filter((item) => item.status === "completed").length;
  const cycleTotalCount = cycleStubs.length;
  const cycleValue = cycleTotalCount > 0
    ? `${formatNumber(cycleCompletedCount)} / ${formatNumber(cycleTotalCount)} ${t("workout.completeScreen.completedShort")}`
    : t("workout.completeScreen.noCycleProgress");
  const nextUpValue = upcomingStub
    ? `${getLiftLabel(upcomingStub.mainLiftKey)} · ${t("week.title", { week: upcomingStub.weekIndex + 1 })}`
    : t("workout.completeScreen.noNextWorkout");

  useEffect(() => {
    if (!hasPrReward) return;

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [hasPrReward]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mainStack}>
          <RevealView style={styles.heroCopy}>
            <Text style={styles.heroTitle}>
              {t("workout.completeScreen.title")}
            </Text>
            <Text style={styles.heroSubtitle}>
              {liftLabel
                ? t("workout.completeScreen.subtitle", { lift: liftLabel })
                : t("workout.completeScreen.subtitleFallback")}
            </Text>
          </RevealView>

          <View style={styles.summarySection}>
            <RevealView delay={motion.duration.fast}>
              <TopSetHero
                value={topSetSummary.value}
                detail={topSetSummary.detail}
                detailTone={topSetSummary.detailTone}
              />
            </RevealView>

            <RevealView delay={motion.duration.fast + motion.duration.instant}>
              <ResultCard
                reward={hasPrReward}
                label={t("workout.completeScreen.estimatedOneRepMax")}
                value={estimatedPrValue}
                detail={prDetail}
                detailTone={hasPrReward ? "positive" : "neutral"}
              />
            </RevealView>

            <RevealView delay={motion.duration.fast + motion.duration.instant * 2}>
              <ResultCard
                label={t("workout.completeScreen.nextUp")}
                value={nextUpValue}
              />
            </RevealView>

            <RevealView delay={motion.duration.fast + motion.duration.instant * 3}>
              <ResultCard
                label={t("workout.completeScreen.thisCycle")}
                value={cycleValue}
              />
            </RevealView>

          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title={t("workout.completeScreen.backToPlan")}
            onPress={goToPlan}
          />
          <Button
            title={t("workout.completeScreen.viewLog")}
            variant="secondary"
            onPress={viewSessionLog}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing["5xl"],
    paddingBottom: spacing["3xl"],
    justifyContent: "space-between",
    gap: spacing["2xl"],
  },
  mainStack: {
    gap: spacing["2xl"],
  },
  heroCopy: {
    gap: spacing.sm,
  },
  heroTitle: {
    fontSize: fontSize["4xl"],
    lineHeight: 42,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
  },
  heroSubtitle: {
    fontSize: fontSize.lg,
    lineHeight: 26,
    color: colors.textSecondary,
  },
  summarySection: {
    gap: spacing.sm,
  },
  topSetHero: {
    position: "relative",
    minHeight: 176,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.primarySoft,
    justifyContent: "center",
  },
  card: {
    position: "relative",
    overflow: "hidden",
    minHeight: 96,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surfaceGlassStrong,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
  },
  cardReward: {
    borderColor: colors.primary,
  },
  cardRewardGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primarySoft,
  },
  cardLabel: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  topSetValue: {
    fontSize: fontSize["4xl"],
    lineHeight: 42,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
  },
  topSetDetailPill: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
  },
  topSetAchievementPill: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primarySoft,
  },
  topSetMissPill: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  topSetNeutralPill: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  topSetDetailText: {
    fontSize: fontSize.lg,
    lineHeight: 24,
    fontWeight: fontWeight.semibold,
  },
  cardValue: {
    fontSize: fontSize["3xl"],
    lineHeight: 36,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  cardDetail: {
    marginTop: spacing.xs,
    fontSize: fontSize.md,
    lineHeight: 22,
    fontWeight: fontWeight.semibold,
  },
  detailPositive: {
    color: colors.primary,
  },
  detailNegative: {
    color: colors.textSecondary,
  },
  detailNeutral: {
    color: colors.textTertiary,
  },
  actions: {
    gap: spacing.sm,
  },
});
