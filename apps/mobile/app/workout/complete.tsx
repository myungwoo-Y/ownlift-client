import type { SetLogRecord, WorkoutResultRecord } from "@ownlift/db";
import { getSetLogsBySession, getWorkoutResultBySession, getWorkoutResultsByInstance } from "@ownlift/db";
import * as Haptics from "expo-haptics";
import LottieView from "lottie-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  ScrollView,
  StyleSheet,
  UIManager,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
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
import {
  borderRadius,
  Button,
  colors,
  FLOATING_NAV_CONTENT_TOP_OFFSET,
  FloatingBackNav,
  fontSize,
  fontWeight,
  motion,
  spacing,
  Text,
} from "../../src/design";
import { formatMeasurement, getSessionEstimatedOneRepMax } from "../../src/history/history-screen/utils";
import { formatNumber, getLiftLabel, t, useLocale } from "../../src/i18n";
import { useProgramStore } from "../../src/stores/program-store";

const confettiAnimation = require("../../assets/animations/flex-confetti.json");
const COMPLETION_TITLE_SIZE = 42;
const COMPLETION_METRIC_SIZE = 46;

type DeltaTone = "negative" | "neutral" | "positive";

interface MetricDisplayParts {
  amount: string;
  unit?: string;
  reps?: string;
}

function canRenderLottieAnimationView() {
  const nativeUIManager = UIManager as typeof UIManager & {
    getViewManagerConfig?: (name: string) => unknown;
    hasViewManagerConfig?: (name: string) => boolean;
  };

  try {
    if (typeof nativeUIManager.hasViewManagerConfig === "function") {
      return nativeUIManager.hasViewManagerConfig("LottieAnimationView");
    }

    return nativeUIManager.getViewManagerConfig?.("LottieAnimationView") != null;
  } catch {
    return false;
  }
}

function CompletionConfetti({
  animationKey,
  enabled,
}: {
  animationKey?: string;
  enabled: boolean;
}) {
  const [isMotionAllowed, setIsMotionAllowed] = useState(false);
  const [isLottieAvailable, setIsLottieAvailable] = useState(false);

  useEffect(() => {
    let isMounted = true;

    setIsLottieAvailable(canRenderLottieAnimationView());

    AccessibilityInfo.isReduceMotionEnabled()
      .then((isReduceMotionEnabled) => {
        if (isMounted) {
          setIsMotionAllowed(!isReduceMotionEnabled);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsMotionAllowed(true);
        }
      });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (isReduceMotionEnabled) => {
        setIsMotionAllowed(!isReduceMotionEnabled);
      },
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  if (!enabled || !isMotionAllowed || !isLottieAvailable) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.confettiLayer}>
      <LottieView
        key={animationKey}
        autoPlay
        loop={false}
        resizeMode="cover"
        source={confettiAnimation}
        style={styles.confettiAnimation}
      />
    </View>
  );
}

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
  metric,
  detail,
  detailTone = "neutral",
  badgeLabel,
  featured = false,
  reward = false,
}: {
  label: string;
  value: string;
  metric?: MetricDisplayParts | null;
  detail?: string | null;
  detailTone?: DeltaTone;
  badgeLabel?: string | null;
  featured?: boolean;
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
    <View style={[styles.card, reward ? styles.cardReward : null, featured ? styles.cardFeatured : null]}>
      {reward ? <Animated.View pointerEvents="none" style={[styles.cardRewardGlow, glowStyle]} /> : null}
      <View style={styles.cardHeaderRow}>
        <Text variant="label" style={styles.cardLabel}>
          {label}
        </Text>
      </View>
      {badgeLabel ? (
        <View style={[styles.badge, styles.cardBadge]}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      ) : null}
      <View style={styles.cardBody}>
        <MetricValueText metric={metric} value={value} size={featured && metric ? "hero" : "card"} />
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
    </View>
  );
}

function MetricValueText({
  metric,
  value,
  size,
}: {
  metric?: MetricDisplayParts | null;
  value: string;
  size: "hero" | "card";
}) {
  return (
    <Text
      adjustsFontSizeToFit
      minimumFontScale={0.72}
      numberOfLines={1}
      style={[
        styles.metricValue,
        size === "hero" ? styles.metricValueHero : styles.metricValueCard,
      ]}
    >
      {metric ? metric.amount : value}
      {metric?.unit ? <Text style={styles.metricUnit}> {metric.unit}</Text> : null}
      {metric?.reps ? <Text style={styles.metricSeparator}> × </Text> : null}
      {metric?.reps ? <Text style={styles.metricReps}>{metric.reps}</Text> : null}
    </Text>
  );
}

function TopSetHero({
  value,
  metric,
  detail,
  detailTone,
}: {
  value: string;
  metric?: MetricDisplayParts | null;
  detail: string;
  detailTone: DeltaTone;
}) {
  const shouldShowDetail = metric == null && detail.length > 0;

  return (
    <View style={styles.topSetHero}>
      <View style={styles.cardHeaderRow}>
        <Text variant="label" style={styles.cardLabel}>
          {t("workout.completeScreen.topSet")}
        </Text>
      </View>
      <View style={styles.cardBody}>
        <MetricValueText metric={metric} value={value} size={metric ? "hero" : "card"} />
        {shouldShowDetail ? (
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
    </View>
  );
}

function CycleProgressCard({
  label,
  value,
  progress,
}: {
  label: string;
  value: string;
  progress: number;
}) {
  const progressWidth = `${Math.max(0, Math.min(100, Math.round(progress * 100)))}%` as ViewStyle["width"];

  return (
    <View style={[styles.card, styles.cycleCard]}>
      <View style={styles.cardHeaderRow}>
        <Text variant="label" style={styles.cardLabel}>
          {label}
        </Text>
      </View>
      <View style={styles.cardBody}>
        <Text adjustsFontSizeToFit minimumFontScale={0.82} numberOfLines={1} style={styles.cycleValue}>
          {value}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </View>
    </View>
  );
}

function getTopSetSummary(logs: SetLogRecord[], unit: string): {
  value: string;
  metric?: MetricDisplayParts | null;
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
  const metric = weight != null && reps != null
    ? {
      amount: formatNumber(weight, { maximumFractionDigits: 1 }),
      unit,
      reps: formatNumber(reps),
    }
    : null;

  if (reps == null || targetReps == null) {
    return {
      value,
      metric,
      detail: t("workout.completeScreen.noTopSetDetail"),
      detailTone: "neutral",
    };
  }

  const delta = reps - targetReps;
  if (delta > 0) {
    return {
      value,
      metric,
      detail: t("workout.completeScreen.targetRepsAbove", { count: formatNumber(delta) }),
      detailTone: "positive",
    };
  }

  if (delta < 0) {
    return {
      value,
      metric,
      detail: t("workout.completeScreen.targetRepsBelow", { count: formatNumber(Math.abs(delta)) }),
      detailTone: "negative",
    };
  }

  return {
    value,
    metric,
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
  const estimatedPrMetric = estimatedPr != null
    ? {
      amount: formatNumber(estimatedPr, { maximumFractionDigits: 1 }),
      unit,
    }
    : null;
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
  const cycleProgress = cycleTotalCount > 0 ? cycleCompletedCount / cycleTotalCount : 0;
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
      <FloatingBackNav
        onPress={goToPlan}
        accessibilityLabel={t("common.back")}
      />
      <ScrollView contentContainerStyle={styles.content} style={styles.scroll}>
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
                metric={topSetSummary.metric}
                detail={topSetSummary.detail}
                detailTone={topSetSummary.detailTone}
              />
            </RevealView>

            <RevealView delay={motion.duration.fast + motion.duration.instant}>
              <ResultCard
                reward={hasPrReward}
                featured
                badgeLabel={hasPrReward ? "PR" : null}
                label={t("workout.completeScreen.estimatedOneRepMax")}
                value={estimatedPrValue}
                metric={estimatedPrMetric}
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
              <CycleProgressCard
                label={t("workout.completeScreen.thisCycle")}
                value={cycleValue}
                progress={cycleProgress}
              />
            </RevealView>

          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title={t("workout.completeScreen.backToPlan")}
            onPress={goToPlan}
            style={styles.primaryAction}
          />
          <Button
            title={t("workout.completeScreen.viewLog")}
            variant="secondary"
            onPress={viewSessionLog}
            style={styles.secondaryAction}
          />
        </View>
      </ScrollView>
      <CompletionConfetti
        animationKey={sessionId}
        enabled={sessionId != null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing["2xl"],
    paddingTop: FLOATING_NAV_CONTENT_TOP_OFFSET,
    paddingBottom: spacing["3xl"],
    justifyContent: "space-between",
    gap: spacing["3xl"],
  },
  mainStack: {
    gap: spacing["3xl"],
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    elevation: 2,
    zIndex: 2,
  },
  confettiAnimation: {
    position: "absolute",
    top: -spacing["5xl"],
    right: 0,
    bottom: -spacing["2xl"],
    left: 0,
    opacity: 0.9,
  },
  heroCopy: {
    gap: spacing.sm,
  },
  heroTitle: {
    fontSize: COMPLETION_TITLE_SIZE,
    lineHeight: 48,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    textShadowColor: "rgba(0, 0, 0, 0.84)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 0,
  },
  heroSubtitle: {
    fontSize: fontSize.lg,
    lineHeight: 26,
    color: colors.textSecondary,
  },
  summarySection: {
    gap: spacing.lg,
  },
  topSetHero: {
    position: "relative",
    minHeight: 112,
    borderRadius: borderRadius.xl,
    borderCurve: "continuous",
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.lg,
    backgroundColor: colors.surfaceGlassStrong,
  },
  card: {
    position: "relative",
    overflow: "hidden",
    minHeight: 104,
    borderRadius: borderRadius.xl,
    borderCurve: "continuous",
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.lg,
    backgroundColor: colors.surfaceGlassStrong,
  },
  cardReward: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  cardFeatured: {
    minHeight: 124,
  },
  cardRewardGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primarySoft,
  },
  cardHeaderRow: {
    minHeight: 16,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  cardLabel: {
    color: colors.textSecondary,
  },
  cardBody: {
    flex: 1,
    justifyContent: "center",
  },
  badge: {
    minWidth: 48,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
  },
  cardBadge: {
    position: "absolute",
    top: spacing.lg,
    right: spacing["2xl"],
  },
  badgeText: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    fontWeight: fontWeight.extrabold,
    color: colors.primaryForeground,
  },
  metricValue: {
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    textShadowColor: "rgba(0, 0, 0, 0.84)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 0,
  },
  metricValueHero: {
    fontSize: COMPLETION_METRIC_SIZE,
    lineHeight: 52,
  },
  metricValueCard: {
    fontSize: fontSize["2xl"],
    lineHeight: 32,
  },
  metricUnit: {
    fontSize: fontSize["2xl"],
    lineHeight: 34,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
  },
  metricSeparator: {
    color: colors.text,
  },
  metricReps: {
    color: colors.text,
  },
  cardDetail: {
    marginTop: spacing.sm,
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
  cycleCard: {
    minHeight: 104,
    paddingVertical: spacing.lg,
  },
  cycleValue: {
    fontSize: fontSize.xl,
    lineHeight: 28,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  progressTrack: {
    height: 7,
    marginTop: spacing.md,
    overflow: "hidden",
    borderRadius: borderRadius.full,
    backgroundColor: colors.borderStrong,
  },
  progressFill: {
    height: "100%",
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  actions: {
    gap: spacing.md,
  },
  primaryAction: {
    minHeight: 58,
  },
  secondaryAction: {
    minHeight: 58,
    backgroundColor: colors.transparent,
    borderColor: colors.borderStrong,
  },
});
