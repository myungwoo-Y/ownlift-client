import type { SetLogRecord, WorkoutResultRecord } from "@ownlift/db";
import { getSetLogsBySession, getWorkoutResultBySession, getWorkoutResultsByInstance } from "@ownlift/db";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { borderRadius, Button, colors, fontSize, fontWeight, spacing, Text } from "../../src/design";
import { formatMeasurement, getSessionEstimatedOneRepMax } from "../../src/history/history-screen/utils";
import { formatNumber, getLiftLabel, t, useLocale } from "../../src/i18n";
import { useProgramStore } from "../../src/stores/program-store";

function MetricRow({
  label,
  value,
  deltaValue,
  deltaTone = "neutral",
  emphasized = false,
}: {
  label: string;
  value: string;
  deltaValue?: string | null;
  deltaTone?: "negative" | "neutral" | "positive";
  emphasized?: boolean;
}) {
  return (
    <View style={[styles.metricRow, emphasized ? styles.metricRowEmphasized : null]}>
      <Text variant="label" style={styles.metricLabel}>
        {label}
      </Text>
      <View style={styles.metricValueRow}>
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.78}
          numberOfLines={1}
          style={[styles.metricValue, emphasized ? styles.metricValueEmphasized : null]}
        >
          {value}
        </Text>
        {deltaValue ? (
          <Text
            style={[
              styles.metricDelta,
              deltaTone === "positive"
                ? styles.metricDeltaPositive
                : deltaTone === "negative"
                  ? styles.metricDeltaNegative
                  : styles.metricDeltaNeutral,
            ]}
          >
            {deltaValue}
          </Text>
        ) : null}
      </View>
    </View>
  );
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

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

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

  const estimatedPr = useMemo(() => getSessionEstimatedOneRepMax(logs), [logs]);
  const liftLabel = stub ? getLiftLabel(stub.mainLiftKey) : null;
  const unit = instance?.params.unit ?? "kg";
  const estimatedPrValue = estimatedPr != null
    ? formatMeasurement(estimatedPr, unit)
    : t("workout.completeScreen.estimatedPrEmpty");
  const previousGap = estimatedPr != null && previousEstimatedPr != null
    ? estimatedPr - previousEstimatedPr
    : null;
  const previousGapValue = previousGap != null
    ? `${previousGap > 0 ? "+" : previousGap < 0 ? "-" : ""}${formatMeasurement(Math.abs(previousGap), unit)}`
    : null;
  const previousGapTone = previousGap == null
    ? "neutral"
    : previousGap > 0
      ? "positive"
      : previousGap < 0
        ? "negative"
        : "neutral";
  const isBelowPreviousPr = previousGap != null && previousGap < 0;
  const volumeValue = result?.summary?.totalVolume != null && instance
    ? `${formatNumber(result.summary.totalVolume)} ${instance.params.unit}`
    : null;
  const nextUpLabel = upcomingStub
    ? getLiftLabel(upcomingStub.mainLiftKey)
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mainStack}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>
              {t("workout.completeScreen.title")}
            </Text>
            <Text style={styles.heroSubtitle}>
              {liftLabel
                ? t("workout.completeScreen.subtitle", { lift: liftLabel })
                : t("workout.completeScreen.subtitleFallback")}
            </Text>
          </View>

          <View style={styles.summarySection}>
            <MetricRow
              emphasized
              label={t("workout.completeScreen.estimatedPr")}
              value={estimatedPrValue}
              deltaValue={previousGapValue}
              deltaTone={previousGapTone}
            />

            {isBelowPreviousPr ? (
              <View style={styles.encouragementBox}>
                <Text style={styles.encouragementText}>
                  {t("workout.completeScreen.encouragement")}
                </Text>
              </View>
            ) : null}

            {nextUpLabel ? (
              <MetricRow
                label={t("workout.completeScreen.nextUp")}
                value={nextUpLabel}
              />
            ) : null}

            {volumeValue ? (
              <MetricRow
                label={t("workout.completeScreen.volume")}
                value={volumeValue}
              />
            ) : null}
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
    backgroundColor: colors.backgroundDeep,
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
  metricRow: {
    minHeight: 68,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceGlassStrong,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
  },
  metricRowEmphasized: {
    minHeight: 112,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderStrong,
  },
  metricLabel: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  metricValueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metricValue: {
    flexShrink: 1,
    fontSize: fontSize.xl,
    lineHeight: 26,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  metricValueEmphasized: {
    fontSize: fontSize["4xl"],
    lineHeight: 42,
    fontWeight: fontWeight.extrabold,
    color: colors.primary,
  },
  metricDelta: {
    paddingBottom: spacing.xs,
    fontSize: fontSize.lg,
    lineHeight: 24,
    fontWeight: fontWeight.semibold,
  },
  metricDeltaPositive: {
    color: colors.primary,
  },
  metricDeltaNegative: {
    color: colors.textSecondary,
  },
  metricDeltaNeutral: {
    color: colors.textTertiary,
  },
  encouragementBox: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  encouragementText: {
    fontSize: fontSize.md,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  actions: {
    gap: spacing.sm,
  },
});
