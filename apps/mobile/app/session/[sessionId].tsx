import type { SetLogRecord, WorkoutResultRecord } from "@ownlift/db";
import { getPrescriptionBySession, getSetLogsBySession, getWorkoutResultBySession } from "@ownlift/db";
import type { PrescriptionData } from "@ownlift/schemas";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Card,
  colors,
  FLOATING_NAV_CONTENT_TOP_OFFSET,
  FloatingBackNav,
  fontSize,
  fontWeight,
  spacing,
  Text,
} from "../../src/design";
import { formatDate, formatNumber, getLiftLabel, t, useLocale } from "../../src/i18n";
import {
  buildMockHistoryItems,
  buildMockHistorySessionDetail,
} from "../../src/history/mock-history";
import { useProgramStore } from "../../src/stores/program-store";

export default function SessionDetailScreen() {
  useLocale();

  const { sessionId, source } = useLocalSearchParams<{ sessionId: string; source?: string }>();
  const router = useRouter();
  const { stubs, instance } = useProgramStore();

  const [prescription, setPrescription] = useState<PrescriptionData | null>(null);
  const [setLogs, setSetLogs] = useState<SetLogRecord[]>([]);
  const [result, setResult] = useState<WorkoutResultRecord | null>(null);

  const stub = stubs.find((s) => s.sessionId === sessionId);
  const mockHistoryItem = useMemo(() => {
    if (stub || !instance || !sessionId || !__DEV__) {
      return null;
    }

    return buildMockHistoryItems(instance).find((item) => item.sessionId === sessionId) ?? null;
  }, [instance, sessionId, stub]);
  const displayStub = stub ?? mockHistoryItem;
  const fallbackRoute = source === "history" ? "/(tabs)/history" : "/(tabs)/plan";

  const goBack = useCallback(() => {
    try {
      if (router.canGoBack()) {
        router.back();
        return;
      }

      if (router.canDismiss()) {
        router.dismiss();
        return;
      }

      router.dismissTo(fallbackRoute);
    } catch {
      try {
        router.dismissTo(fallbackRoute);
      } catch {
        try {
          router.replace(fallbackRoute);
        } catch {
        }
      }
    }
  }, [fallbackRoute, router]);

  useEffect(() => {
    async function load() {
      if (!sessionId) return;

      if (!stub && mockHistoryItem && instance && __DEV__) {
        const mockDetail = buildMockHistorySessionDetail(instance, mockHistoryItem);
        setPrescription(mockDetail.prescription);
        setSetLogs(mockDetail.setLogs);
        setResult(mockDetail.result);
        return;
      }

      const [rx, logs, wr] = await Promise.all([
        getPrescriptionBySession(sessionId),
        getSetLogsBySession(sessionId),
        getWorkoutResultBySession(sessionId),
      ]);
      setPrescription(rx?.data ?? null);
      setSetLogs(logs);
      setResult(wr);
    }
    void load();
  }, [instance, mockHistoryItem, sessionId, stub]);

  if (!displayStub || !instance) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text variant="body">{t("session.notFound")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const unit = instance.params.unit;

  const workSets = prescription?.sets.filter((s) => !s.isWarmup) ?? [];

  // Format date
  const dateStr = result?.completedAt
    ? formatDate(result.completedAt, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <FloatingBackNav
        onPress={goBack}
        accessibilityLabel={t("common.back")}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.workoutTitle} adjustsFontSizeToFit numberOfLines={1}>
            {getLiftLabel(displayStub.mainLiftKey)}
          </Text>
          <Text style={styles.workoutWeek}>
            {t("week.title", { week: displayStub.weekIndex + 1 })}
          </Text>

          {dateStr && (
            <Text style={styles.headerMetaText}>{dateStr}</Text>
          )}
          {result?.summary?.totalVolume ? (
            <Text style={styles.headerMetaText}>
              {t("session.volume", { volume: formatNumber(result.summary.totalVolume), unit })}
            </Text>
          ) : null}
        </View>

        <View style={styles.setGroup}>
          <SetTableHeader />
          {workSets.map((set, index) => {
            const log = setLogs.find((l) => l.setOrder === set.setOrder);
            const isSetCompleted = log?.isCompleted === true;
            return (
              <ReadonlySetRow
                key={set.setOrder}
                setNumber={index + 1}
                weight={log?.actualWeight ?? set.targetWeight}
                reps={isSetCompleted ? log?.actualReps ?? set.targetReps : 0}
                unit={unit}
                isCompleted={isSetCompleted}
                isAmrap={set.isAmrap}
              />
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SetTableHeader() {
  return (
    <View style={styles.setTableHeader}>
      <View style={styles.setNumberColumn}>
        <Text style={styles.setTableHeaderText}>{t("workout.table.set")}</Text>
      </View>
      <View style={styles.weightColumn}>
        <Text style={styles.setTableHeaderText}>{t("workout.table.weight")}</Text>
      </View>
      <View style={styles.repsColumn}>
        <Text style={styles.setTableHeaderText}>{t("workout.table.reps")}</Text>
      </View>
    </View>
  );
}

function ReadonlySetRow({
  setNumber,
  weight,
  reps,
  unit,
  isCompleted,
  isAmrap,
}: {
  setNumber: number;
  weight: number;
  reps: number;
  unit: string;
  isCompleted: boolean;
  isAmrap: boolean;
}) {
  return (
    <Card style={styles.setRowCard}>
      <View style={styles.setRowContent}>
        <View style={styles.setNumberColumn}>
          <Text style={[styles.setNumber, isCompleted ? styles.setNumberActive : styles.setNumberMuted]}>
            {String(setNumber)}
          </Text>
        </View>
        <View style={styles.weightColumn}>
          <View style={styles.metricGroup}>
            <Text style={styles.metricNumber}>{formatNumber(weight)}</Text>
            <Text style={styles.metricUnit}>{unit}</Text>
          </View>
        </View>
        <View style={styles.repsColumn}>
          <View style={styles.metricGroup}>
            <Text style={styles.metricNumber}>{formatNumber(reps)}</Text>
            <Text style={styles.metricUnit}>{t("unit.reps")}</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: FLOATING_NAV_CONTENT_TOP_OFFSET,
    paddingBottom: spacing["3xl"],
    gap: spacing["2xl"],
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing["2xl"],
  },
  workoutTitle: {
    fontSize: fontSize["4xl"],
    fontWeight: fontWeight.extrabold,
    color: colors.text,
  },
  workoutWeek: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  headerMetaText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    color: colors.textTertiary,
  },
  setGroup: {
    gap: spacing.md,
  },
  setTableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  setTableHeaderText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.textTertiary,
    textAlign: "center",
  },
  setNumberColumn: {
    width: 40,
    alignItems: "center",
  },
  weightColumn: {
    flex: 1.05,
    alignItems: "center",
  },
  repsColumn: {
    flex: 1,
    alignItems: "center",
  },
  setRowCard: {
    minHeight: 104,
    padding: 0,
    justifyContent: "center",
  },
  setRowContent: {
    minHeight: 104,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing["2xl"],
  },
  setNumber: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.bold,
  },
  setNumberActive: {
    color: colors.primary,
  },
  setNumberMuted: {
    color: colors.textSecondary,
  },
  metricGroup: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.xs,
  },
  metricNumber: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  metricUnit: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
});
