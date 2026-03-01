import { getWeekLabel } from "@ownlift/core";
import type { SetLogRecord, WorkoutResultRecord } from "@ownlift/db";
import { getPrescriptionBySession, getSetLogsBySession, getWorkoutResultBySession } from "@ownlift/db";
import type { PrescriptionData } from "@ownlift/schemas";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    Badge,
    Card,
    colors,
    Divider,
    Section,
    spacing,
    Text,
} from "../../src/design";
import { useProgramStore } from "../../src/stores/program-store";

const LIFT_DISPLAY: Record<string, string> = {
  squat: "Squat",
  bench: "Bench Press",
  deadlift: "Deadlift",
  press: "Press",
};

export default function SessionDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { stubs, instance } = useProgramStore();

  const [prescription, setPrescription] = useState<PrescriptionData | null>(null);
  const [setLogs, setSetLogs] = useState<SetLogRecord[]>([]);
  const [result, setResult] = useState<WorkoutResultRecord | null>(null);

  const stub = stubs.find((s) => s.sessionId === sessionId);

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
          <Text variant="body">Session not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const weekLabel = getWeekLabel(stub.weekIndex);
  const sessionLabel = `Session ${String.fromCharCode(65 + stub.dayIndex)}`;
  const unit = instance.params.unit;
  const isCompleted = stub.status === "completed";

  const workSets = prescription?.sets.filter((s) => !s.isWarmup) ?? [];

  // Format date
  const dateStr = result?.completedAt
    ? new Date(result.completedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: true, title: "", headerBackTitle: "Back" }} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="title">
            {LIFT_DISPLAY[stub.mainLiftKey] ?? stub.mainLiftKey}
          </Text>
          <Text variant="subtitle">
            Week {String(stub.weekIndex + 1)} · {sessionLabel}
          </Text>

          <View style={styles.badgeRow}>
            {isCompleted && <Badge variant="completed" label="Completed" />}
            {workSets.some((s) => s.isAmrap) && <Badge variant="amrap" label="+ AMRAP" />}
          </View>

          {dateStr && (
            <Text variant="caption">{dateStr}</Text>
          )}
          {result?.summary?.totalVolume ? (
            <Text variant="caption">
              Volume: {String(result.summary.totalVolume.toLocaleString())} {unit}
            </Text>
          ) : null}
        </View>

        <Divider />

        {/* Work Sets */}
        <Section title="WORK SETS">
          {workSets.map((set) => {
            const log = setLogs.find((l) => l.setOrder === set.setOrder);
            return (
              <Card key={set.setOrder}>
                <View style={styles.setHeader}>
                  <View style={styles.setLabelRow}>
                    <Text style={styles.setLabel}>
                      Set {String(set.setOrder + 1)}
                    </Text>
                    {set.isAmrap && <Badge variant="amrap" label="+ AMRAP" />}
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
                    <Text variant="caption">reps</Text>
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
    backgroundColor: colors.surface,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
  checkCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkMark: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textTertiary,
  },
  checkMarkActive: {
    color: colors.primaryForeground,
  },
});
