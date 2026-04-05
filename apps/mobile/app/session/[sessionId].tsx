import type { SetLogRecord, WorkoutResultRecord } from "@ownlift/db";
import { getPrescriptionBySession, getSetLogsBySession, getWorkoutResultBySession } from "@ownlift/db";
import type { PrescriptionData } from "@ownlift/schemas";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BackButton,
  Badge,
  Card,
  colors,
  Divider,
  Section,
  spacing,
  Text,
} from "../../src/design";
import { formatDate, formatNumber, getLiftLabel, getSessionLabel, t, useLocale } from "../../src/i18n";
import { useProgramStore } from "../../src/stores/program-store";

export default function SessionDetailScreen() {
  useLocale();

  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const { stubs, instance } = useProgramStore();

  const [prescription, setPrescription] = useState<PrescriptionData | null>(null);
  const [setLogs, setSetLogs] = useState<SetLogRecord[]>([]);
  const [result, setResult] = useState<WorkoutResultRecord | null>(null);

  const stub = stubs.find((s) => s.sessionId === sessionId);

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

      router.dismissTo("/(tabs)/plan");
    } catch {
      try {
        router.dismissTo("/(tabs)/plan");
      } catch {
        try {
          router.replace("/(tabs)/plan");
        } catch {
        }
      }
    }
  }, [router]);

  useEffect(() => {
    async function load() {
      if (!sessionId) return;
      const [rx, logs, wr] = await Promise.all([
        getPrescriptionBySession(sessionId),
        getSetLogsBySession(sessionId),
        getWorkoutResultBySession(sessionId),
      ]);
      if (rx) setPrescription(rx.data);
      setSetLogs(logs);
      setResult(wr);
    }
    void load();
  }, [sessionId]);

  if (!stub || !instance) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text variant="body">{t("session.notFound")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const sessionLabel = getSessionLabel(stub.dayIndex);
  const unit = instance.params.unit;
  const isCompleted = stub.status === "completed";

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
      <BackButton
        onPress={goBack}
        accessibilityLabel={t("common.back")}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topActions}>
      
        </View>
        <View style={styles.header}>
          <Text variant="title">
            {getLiftLabel(stub.mainLiftKey)}
          </Text>
          <Text variant="subtitle">
            {t("session.weekAndSession", { week: stub.weekIndex + 1, session: sessionLabel })}
          </Text>

          <View style={styles.badgeRow}>
            {isCompleted && <Badge variant="completed" label={t("status.completed")} />}
            {workSets.some((s) => s.isAmrap) && <Badge variant="amrap" label={t("badge.amrap")} />}
          </View>

          {dateStr && (
            <Text variant="caption">{dateStr}</Text>
          )}
          {result?.summary?.totalVolume ? (
            <Text variant="caption">
              {t("session.volume", { volume: formatNumber(result.summary.totalVolume), unit })}
            </Text>
          ) : null}
        </View>

        <Divider />

        {/* Work Sets */}
        <Section title={t("session.section.workSets")}>
          {workSets.map((set) => {
            const log = setLogs.find((l) => l.setOrder === set.setOrder);
            return (
              <Card key={set.setOrder}>
                <View style={styles.setHeader}>
                  <View style={styles.setLabelRow}>
                    <Text style={styles.setLabel}>
                      {t("workout.setLabel", { set: set.setOrder + 1 })}
                    </Text>
                    {set.isAmrap && <Badge variant="amrap" label={t("badge.amrap")} />}
                  </View>
                  <Text variant="caption">
                    {String(set.targetWeight)}{unit} × {String(set.targetReps)}
                  </Text>
                </View>

                <View style={styles.setValues}>
                  <View style={styles.valueBox}>
                    <Text style={styles.valueNumber}>
                      {log ? String(log.actualWeight ?? "—") : "—"}
                    </Text>
                    <Text variant="caption">{unit}</Text>
                  </View>
                  <Text style={styles.times}>×</Text>
                  <View style={styles.valueBox}>
                    <Text style={styles.valueNumber}>
                      {log ? String(log.actualReps ?? "—") : "—"}
                    </Text>
                    <Text variant="caption">{t("unit.reps")}</Text>
                  </View>
                  <View style={[styles.checkCircle, log?.isCompleted && styles.checkCircleActive]}>
                    <Text style={[styles.checkMark, log?.isCompleted && styles.checkMarkActive]}>
                      ✓
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })}
        </Section>
      </ScrollView>
    </SafeAreaView>
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
    padding: spacing["2xl"],
    gap: spacing["2xl"],
  },
  header: {
    gap: spacing.sm,
  },
  topActions: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  badgeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  setHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  setLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  setLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  setValues: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  valueBox: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: "center",
    minWidth: 72,
  },
  valueNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  times: {
    fontSize: 17,
    color: colors.textSecondary,
  },
  checkCircle: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
  checkCircleActive: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.accent,
  },
  checkMark: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textTertiary,
  },
  checkMarkActive: {
    color: colors.accent,
  },
});
