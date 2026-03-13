import { updateStubStatus } from "@ownlift/db";
import type { PrescriptionData } from "@ownlift/schemas";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View, type DimensionValue } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BackButton,
  Badge,
  borderRadius,
  Button,
  Card,
  colors,
  Divider,
  NumericInput,
  Section,
  spacing,
  Text,
} from "../../src/design";
import { getLiftLabel, getWeekLabel, t, useLocale } from "../../src/i18n";
import { loadSyncedPrescriptionForSession } from "../../src/program/prescription-sync";
import { useProgramStore } from "../../src/stores/program-store";
import { useWorkoutStore, type WorkoutSetState } from "../../src/stores/workout-store";

type WorkoutScreenMode = "loading" | "preview" | "active";
type WorkoutSetType = WorkoutSetState;

export default function WorkoutScreen() {
  useLocale();

  const params = useLocalSearchParams<{ sessionId?: string | string[]; autostart?: string | string[] }>();
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;
  const autostart = Array.isArray(params.autostart) ? params.autostart[0] : params.autostart;
  const router = useRouter();
  const { instance, stubs, nextStub, completeSession, loadProgram } = useProgramStore();
  const isWorkoutLoading = useWorkoutStore((state) => state.isLoading);
  const activePrescription = useWorkoutStore((state) => state.prescription);
  const sets = useWorkoutStore((state) => state.sets);
  const startWorkout = useWorkoutStore((state) => state.startWorkout);
  const updateSet = useWorkoutStore((state) => state.updateSet);
  const toggleSetComplete = useWorkoutStore((state) => state.toggleSetComplete);
  const completeWorkout = useWorkoutStore((state) => state.completeWorkout);
  const resetWorkout = useWorkoutStore((state) => state.resetWorkout);
  const [mode, setMode] = useState<WorkoutScreenMode>("loading");
  const [previewPrescription, setPreviewPrescription] = useState<PrescriptionData | null>(null);
  const [isScreenLoading, setIsScreenLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stub = stubs.find((item) => item.sessionId === sessionId);
  const sessionStatus = stub?.status;
  const instanceId = instance?.instanceId;
  const shouldAutostart = autostart === "1";
  const isTodaySession = nextStub?.sessionId === sessionId;
  const canStartTodayWorkout = Boolean(stub && stub.status !== "completed" && isTodaySession);
  const isWorkoutActive = mode === "active";
  const prescription = isWorkoutActive ? activePrescription : previewPrescription;

  useEffect(() => {
    setMode("loading");
    setPreviewPrescription(null);
    setIsScreenLoading(true);
    setIsStarting(false);
    setIsSubmitting(false);
  }, [sessionId]);

  useEffect(() => () => {
    resetWorkout();
  }, [sessionId, resetWorkout]);

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

      router.dismissTo("/(tabs)");
    } catch {
      try {
        router.dismissTo("/(tabs)");
      } catch {
        try {
          router.replace("/(tabs)");
        } catch {
        }
      }
    }
  }, [router]);

  const activateWorkout = useCallback(
    async ({ markStarted }: { markStarted: boolean }) => {
      if (!sessionId || !instanceId) return;

      await startWorkout(sessionId, instanceId);

      if (markStarted) {
        await updateStubStatus({ sessionId, status: "started" });
        void loadProgram();
      }

      setPreviewPrescription(null);
      setMode("active");
    },
    [instanceId, loadProgram, sessionId, startWorkout],
  );

  useEffect(() => {
    let isCancelled = false;

    async function initializeScreen() {
      if (!sessionId || !instanceId || !sessionStatus) return;
      if (mode === "active" || (mode === "preview" && previewPrescription)) {
        setIsScreenLoading(false);
        return;
      }

      try {
        setIsScreenLoading(true);

        if (sessionStatus === "started") {
          await activateWorkout({ markStarted: false });
          return;
        }

        if (shouldAutostart && canStartTodayWorkout) {
          await activateWorkout({ markStarted: true });
          return;
        }

        const rx = await loadSyncedPrescriptionForSession({
          sessionId,
          instance,
          stub,
        });
        if (isCancelled) return;

        setPreviewPrescription(rx?.data ?? null);
        setMode("preview");
      } catch (error) {
        console.error("Failed to initialize workout:", error);
      } finally {
        if (!isCancelled) {
          setIsScreenLoading(false);
        }
      }
    }

    void initializeScreen();

    return () => {
      isCancelled = true;
    };
  }, [activateWorkout, canStartTodayWorkout, instance, instanceId, mode, previewPrescription, sessionId, sessionStatus, shouldAutostart, stub]);

  if (isScreenLoading || (isWorkoutActive && isWorkoutLoading) || !stub || !instance) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text variant="body">{t("workout.loading")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!prescription) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text variant="body">{t("session.notFound")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const weekLabel = getWeekLabel(stub.weekIndex);
  const completedCount = stubs.filter((item) => item.status === "completed").length;
  const totalCount = stubs.length;
  const allSetsCompleted = sets.every((item) => item.isCompleted);
  const workSets = isWorkoutActive
    ? sets
    : prescription.sets
        .filter((setData) => !setData.isWarmup)
        .map((setData) => ({
          id: `preview-${setData.setOrder}`,
          setOrder: setData.setOrder,
          prescribed: setData,
          actualWeight: String(setData.targetWeight),
          actualReps: String(setData.targetReps),
          isCompleted: false,
          isAmrap: setData.isAmrap,
        }));

  const handleComplete = async () => {
    if (isSubmitting || !sessionId || !isWorkoutActive) return;

    try {
      setIsSubmitting(true);
      await completeWorkout();
      await completeSession(sessionId);
      goBack();
    } catch (error) {
      console.error("Failed to complete workout:", error);
      Alert.alert(
        t("workout.errorCompleteTitle"),
        t("workout.errorCompleteMessage"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartWorkout = async () => {
    if (!canStartTodayWorkout || isStarting || isSubmitting) return;

    try {
      setIsStarting(true);
      await activateWorkout({ markStarted: stub.status === "planned" });
    } catch (error) {
      console.error("Failed to start workout:", error);
      Alert.alert(
        t("workout.errorStartTitle"),
        t("workout.errorStartMessage"),
      );
    } finally {
      setIsStarting(false);
    }
  };

  const confirmComplete = () => {
    if (!allSetsCompleted) {
      Alert.alert(
        t("workout.incompleteTitle"),
        t("workout.incompleteMessage"),
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("common.complete"), onPress: () => void handleComplete() },
        ],
      );
    } else {
      void handleComplete();
    }
  };

  const confirmExit = () => {
    if (isSubmitting) return;
    if (!isWorkoutActive) {
      goBack();
      return;
    }

    Alert.alert(
      t("workout.exitTitle"),
      t("workout.exitMessage"),
      [
        { text: t("workout.stay"), style: "cancel" },
        { text: t("workout.exit"), style: "destructive", onPress: goBack },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <BackButton
        onPress={confirmExit}
        disabled={isSubmitting || isStarting}
        accessibilityLabel={t("common.back")}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topActions}>
        </View>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text variant="title">
              {getLiftLabel(stub.mainLiftKey)}
            </Text>
            <Text variant="subtitle">
              {t("workout.subtitle", { week: stub.weekIndex + 1, label: weekLabel })}
            </Text>
          </View>
          <View style={styles.badgeRow}>
            {isTodaySession ? (
              <Badge variant="today" label={t("status.today")} />
            ) : (
              <Badge
                variant={stub.status === "completed" ? "completed" : "planned"}
                label={stub.status === "completed" ? t("status.completed") : t("status.planned")}
              />
            )}
            {workSets.some((setData) => setData.isAmrap) ? (
              <Badge variant="amrap" label={t("badge.amrap")} />
            ) : null}
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.round((completedCount / Math.max(totalCount, 1)) * 100)}%` as DimensionValue },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {String(completedCount)}/{String(totalCount)}
          </Text>
        </View>

        <Divider />

        {!isWorkoutActive ? (
          <Card>
            <View style={styles.previewNotice}>
              <Text style={styles.previewNoticeTitle}>
                {canStartTodayWorkout ? t("workout.readyToStart") : t("workout.onlyTodayCanStart")}
              </Text>
            </View>
          </Card>
        ) : null}

        <Section title={t("workout.section.workSets")}>
          {workSets.map((setData) => (
            <SetCard
              key={setData.id}
              data={setData}
              unit={instance.params.unit}
              editable={isWorkoutActive}
              onChangeWeight={(value) => updateSet(setData.id, "actualWeight", value)}
              onChangeReps={(value) => updateSet(setData.id, "actualReps", value)}
              onToggle={() => void toggleSetComplete(setData.id)}
            />
          ))}
        </Section>
      </ScrollView>

      {(isWorkoutActive || canStartTodayWorkout) ? (
        <View style={styles.ctaContainer}>
          <Divider />
          <View style={styles.ctaPadding}>
            <Button
              title={isWorkoutActive
                ? (isSubmitting ? t("workout.saving") : t("workout.completeWorkout"))
                : (isStarting ? t("workout.starting") : t("workout.startWorkout"))}
              onPress={isWorkoutActive ? confirmComplete : () => void handleStartWorkout()}
              disabled={isWorkoutActive ? isSubmitting : isStarting}
            />
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function SetCard({
  data,
  unit,
  onChangeWeight,
  onChangeReps,
  onToggle,
  editable = true,
}: {
  data: WorkoutSetType;
  unit: string;
  onChangeWeight: (v: string) => void;
  onChangeReps: (v: string) => void;
  onToggle: () => void;
  editable?: boolean;
}) {
  return (
    <Card>
      <View style={styles.setHeader}>
        <View style={styles.setLabelRow}>
          <Text style={styles.setLabel}>{t("workout.setLabel", { set: data.setOrder + 1 })}</Text>
          {data.isAmrap ? <Badge variant="amrap" label={t("badge.amrap")} /> : null}
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
          editable={editable}
        />
        <NumericInput
          value={data.actualReps}
          onChangeText={onChangeReps}
          unit={t("unit.reps")}
          editable={editable}
        />
        <Pressable
          style={[
            styles.checkButton,
            data.isCompleted && styles.checkButtonActive,
            !editable && styles.checkButtonDisabled,
          ]}
          onPress={onToggle}
          disabled={!editable}
        >
          <Text style={[styles.checkMark, data.isCompleted && styles.checkMarkActive]}>
            ✓
          </Text>
        </Pressable>
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
    padding: spacing["2xl"],
    paddingBottom: 120,
    gap: spacing["2xl"],
  },
  header: {
    gap: spacing.sm,
  },
  topActions: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  badgeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
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
  previewNotice: {
    gap: spacing.xs,
  },
  previewNoticeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
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
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkButtonActive: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.accent,
  },
  checkButtonDisabled: {
    opacity: 0.45,
  },
  checkMark: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textTertiary,
  },
  checkMarkActive: {
    color: colors.accent,
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
