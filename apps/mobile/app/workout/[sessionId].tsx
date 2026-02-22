import { getWeekLabel } from "@ownlift/core";
import { updateStubStatus } from "@ownlift/db";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import {
    Badge,
    borderRadius,
    Button, Card,
    colors,
    Divider,
    NumericInput, Section,
    spacing,
    Text,
} from "../../src/design";
import { useProgramStore } from "../../src/stores/program-store";
import { useWorkoutStore, type WorkoutSetState } from "../../src/stores/workout-store";

const LIFT_DISPLAY: Record<string, string> = {
  squat: "Squat",
  bench: "Bench Press",
  deadlift: "Deadlift",
  press: "Press",
};

export default function WorkoutScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const { instance, stubs, completeSession } = useProgramStore();
  const workout = useWorkoutStore();

  const stub = stubs.find((s) => s.sessionId === sessionId);

  useEffect(() => {
    if (sessionId && instance) {
      void workout.startWorkout(sessionId, instance.instanceId);
      // Mark session as started
      void updateStubStatus({ sessionId, status: "started" });
    }
    return () => workout.resetWorkout();
  }, [sessionId, instance?.instanceId]);

  if (workout.isLoading || !stub || !instance || !workout.prescription) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text variant="body">Loading workout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const weekLabel = getWeekLabel(stub.weekIndex);
  const completedCount = stubs.filter((s) => s.status === "completed").length;
  const totalCount = stubs.length;
  const allSetsCompleted = workout.sets.every((s) => s.isCompleted);

  const handleComplete = async () => {
    await workout.completeWorkout();
    await completeSession(sessionId);
    router.back();
  };

  const confirmComplete = () => {
    if (!allSetsCompleted) {
      Alert.alert(
        "Incomplete Sets",
        "Some sets are not marked as complete. Finish anyway?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Complete", onPress: handleComplete },
        ],
      );
    } else {
      void handleComplete();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text variant="title">
              {LIFT_DISPLAY[stub.mainLiftKey] ?? stub.mainLiftKey}
            </Text>
            <Text variant="subtitle">
              Week {String(stub.weekIndex + 1)} / {weekLabel}
            </Text>
          </View>
          {/* Progress bar */}
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${((completedCount / totalCount) * 100).toFixed(0)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {String(completedCount)}/{String(totalCount)}
          </Text>
        </View>

        <Divider />

        {/* Work Sets */}
        <Section title="WORK SETS">
          {workout.sets.map((setData) => (
            <SetCard
              key={setData.id}
              data={setData}
              unit={instance.params.unit}
              onChangeWeight={(v) => workout.updateSet(setData.id, "actualWeight", v)}
              onChangeReps={(v) => workout.updateSet(setData.id, "actualReps", v)}
              onToggle={() => void workout.toggleSetComplete(setData.id)}
            />
          ))}
        </Section>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.ctaContainer}>
        <Divider />
        <View style={styles.ctaPadding}>
          <Button
            title="Complete Workout"
            onPress={confirmComplete}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Set Card Component ─────────────────────────────────

function SetCard({
  data,
  unit,
  onChangeWeight,
  onChangeReps,
  onToggle,
}: {
  data: WorkoutSetType;
  unit: string;
  onChangeWeight: (v: string) => void;
  onChangeReps: (v: string) => void;
  onToggle: () => void;
}) {
  const setNumber = data.setOrder - (data.prescribed.isWarmup ? 0 : 2); // Adjust for 0-indexed work sets

  return (
    <Card>
      <View style={styles.setHeader}>
        <View style={styles.setLabelRow}>
          <Text style={styles.setLabel}>Set {String(data.setOrder + 1)}</Text>
          {data.isAmrap && <Badge variant="amrap" label="+ AMRAP" />}
        </View>
        <Text variant="caption">
          {String(data.prescribed.targetWeight)}{unit} × {String(data.prescribed.targetReps)}
        </Text>
      </View>

      <View style={styles.setInputRow}>
        <NumericInput
          value={data.actualWeight}
          onChangeText={onChangeWeight}
          unit={`${unit} ×`}
        />
        <NumericInput
          value={data.actualReps}
          onChangeText={onChangeReps}
          unit="reps"
        />
        <Pressable
          style={[styles.checkButton, data.isCompleted && styles.checkButtonActive]}
          onPress={onToggle}
        >
          <Text style={[styles.checkMark, data.isCompleted && styles.checkMarkActive]}>
            ✓
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}

type WorkoutSetType = WorkoutSetState;

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
    paddingBottom: 120,
    gap: spacing["2xl"],
  },
  header: {
    gap: spacing.sm,
    paddingTop: spacing["2xl"],
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    textAlign: "right",
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
  setInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  checkButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkButtonActive: {
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
  ctaContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    paddingBottom: spacing["3xl"],
  },
  ctaPadding: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.lg,
  },
});
