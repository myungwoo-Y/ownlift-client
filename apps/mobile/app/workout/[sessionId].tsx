import { updateStubStatus } from "@ownlift/db";
import type { PrescriptionData } from "@ownlift/schemas";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type DimensionValue,
  type TextInput,
} from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
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
import { useSettingsStore } from "../../src/stores/settings-store";
import { useWorkoutStore, type WorkoutSetState } from "../../src/stores/workout-store";

type WorkoutScreenMode = "loading" | "preview" | "active";
type WorkoutSetType = WorkoutSetState;
const REST_EXTENSION_SECONDS = 30;

function toPreviewSetState(setData: PrescriptionData["sets"][number]): WorkoutSetType {
  return {
    id: `preview-${setData.setOrder}`,
    setOrder: setData.setOrder,
    prescribed: setData,
    actualWeight: String(setData.targetWeight),
    actualReps: String(setData.targetReps),
    isCompleted: false,
    isAmrap: setData.isAmrap,
  };
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

export default function WorkoutScreen() {
  useLocale();

  const params = useLocalSearchParams<{ sessionId?: string | string[]; autostart?: string | string[] }>();
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;
  const autostart = Array.isArray(params.autostart) ? params.autostart[0] : params.autostart;
  const router = useRouter();
  const { instance, stubs, nextStub, todayStub, completeSession, loadProgram } = useProgramStore();
  const isWorkoutLoading = useWorkoutStore((state) => state.isLoading);
  const activePrescription = useWorkoutStore((state) => state.prescription);
  const sets = useWorkoutStore((state) => state.sets);
  const startWorkout = useWorkoutStore((state) => state.startWorkout);
  const updateSet = useWorkoutStore((state) => state.updateSet);
  const toggleSetComplete = useWorkoutStore((state) => state.toggleSetComplete);
  const completeWorkout = useWorkoutStore((state) => state.completeWorkout);
  const resetWorkout = useWorkoutStore((state) => state.resetWorkout);
  const defaultRestTimerSeconds = useSettingsStore((state) => state.restTimerSeconds);
  const [mode, setMode] = useState<WorkoutScreenMode>("loading");
  const [previewPrescription, setPreviewPrescription] = useState<PrescriptionData | null>(null);
  const [isScreenLoading, setIsScreenLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(0);
  const [restTimerTotalSeconds, setRestTimerTotalSeconds] = useState(0);
  const [isRestTimerPaused, setIsRestTimerPaused] = useState(false);
  const repsInputRefs = useRef(new Map<string, TextInput | null>());

  const stub = stubs.find((item) => item.sessionId === sessionId);
  const sessionStatus = stub?.status;
  const instanceId = instance?.instanceId;
  const shouldAutostart = autostart === "1";
  const isTodaySession = todayStub?.sessionId === sessionId;
  const canStartTodayWorkout = Boolean(stub && stub.status !== "completed" && isTodaySession);
  const isWorkoutActive = mode === "active";
  const prescription = isWorkoutActive ? activePrescription : previewPrescription;
  const showScheduledDayMessage = Boolean(
    instance?.params.scheduleMode === "scheduled" &&
    nextStub?.sessionId === sessionId &&
    !canStartTodayWorkout,
  );

  useEffect(() => {
    setMode("loading");
    setPreviewPrescription(null);
    setIsScreenLoading(true);
    setIsStarting(false);
    setIsSubmitting(false);
    setRestSecondsRemaining(0);
    setRestTimerTotalSeconds(0);
    setIsRestTimerPaused(false);
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

  const currentSetId = isWorkoutActive ? sets.find((item) => !item.isCompleted)?.id ?? null : null;

  useEffect(() => {
    if (restSecondsRemaining <= 0 || isRestTimerPaused) {
      return;
    }

    const timeout = setTimeout(() => {
      setRestSecondsRemaining((current) => Math.max(0, current - 1));
    }, 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, [isRestTimerPaused, restSecondsRemaining]);

  useEffect(() => {
    if (!isWorkoutActive || !currentSetId) return;

    const timeout = setTimeout(() => {
      repsInputRefs.current.get(currentSetId)?.focus();
    }, 150);

    return () => {
      clearTimeout(timeout);
    };
  }, [currentSetId, isWorkoutActive]);

  const startRestTimer = (seconds: number) => {
    setRestSecondsRemaining(seconds);
    setRestTimerTotalSeconds(seconds);
    setIsRestTimerPaused(false);
  };

  const skipRestTimer = () => {
    setRestSecondsRemaining(0);
    setRestTimerTotalSeconds(0);
    setIsRestTimerPaused(false);
  };

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
  const visibleSets = isWorkoutActive
    ? sets
    : prescription.sets
        .map(toPreviewSetState);
  const warmupSets = visibleSets.filter((setData) => setData.prescribed.isWarmup);
  const workSets = visibleSets.filter((setData) => !setData.prescribed.isWarmup);

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

  const handleToggleSet = async (setData: WorkoutSetType) => {
    if (!isWorkoutActive) return;

    const nextCompleted = !setData.isCompleted;
    const actualReps = parseInt(setData.actualReps, 10);

    if (nextCompleted && setData.isAmrap && (!Number.isFinite(actualReps) || actualReps <= 0)) {
      Alert.alert(
        t("workout.amrapRepsRequiredTitle"),
        t("workout.amrapRepsRequiredMessage"),
      );
      repsInputRefs.current.get(setData.id)?.focus();
      return;
    }

    await toggleSetComplete(setData.id);

    if (nextCompleted && !setData.prescribed.isWarmup) {
      if (setData.isAmrap) {
        skipRestTimer();
      } else if (defaultRestTimerSeconds > 0) {
        startRestTimer(defaultRestTimerSeconds);
      }
    }

    if (!setData.isCompleted) {
      const currentIndex = sets.findIndex((item) => item.id === setData.id);
      const nextSet = sets.slice(currentIndex + 1).find((item) => !item.isCompleted);
      if (nextSet) {
        setTimeout(() => {
          repsInputRefs.current.get(nextSet.id)?.focus();
        }, 50);
      }
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
                {canStartTodayWorkout
                  ? t("workout.readyToStart")
                  : (showScheduledDayMessage
                    ? t("workout.onlyScheduledDayCanStart")
                    : t("workout.onlyTodayCanStart"))}
              </Text>
            </View>
          </Card>
        ) : null}

        {warmupSets.length > 0 ? (
          <Section title={t("workout.section.warmupSets")}>
            {warmupSets.map((setData) => (
              <SetCard
                key={setData.id}
                data={setData}
                unit={instance.params.unit}
                editable={isWorkoutActive}
                isCurrent={currentSetId === setData.id}
                repsInputRef={(node) => {
                  repsInputRefs.current.set(setData.id, node);
                }}
                onChangeWeight={(value) => updateSet(setData.id, "actualWeight", value)}
                onChangeReps={(value) => updateSet(setData.id, "actualReps", value)}
                onToggle={() => void handleToggleSet(setData)}
              />
            ))}
          </Section>
        ) : null}

        <Section title={t("workout.section.workSets")}>
          {workSets.map((setData) => (
            <SetCard
              key={setData.id}
              data={setData}
              unit={instance.params.unit}
              editable={isWorkoutActive}
              isCurrent={currentSetId === setData.id}
              repsInputRef={(node) => {
                repsInputRefs.current.set(setData.id, node);
              }}
              onChangeWeight={(value) => updateSet(setData.id, "actualWeight", value)}
              onChangeReps={(value) => updateSet(setData.id, "actualReps", value)}
              onToggle={() => void handleToggleSet(setData)}
            />
          ))}
        </Section>
      </ScrollView>

      {(isWorkoutActive || canStartTodayWorkout) ? (
        <View style={styles.ctaContainer}>
          <Divider />
          <View style={styles.ctaPadding}>
            {isWorkoutActive && restSecondsRemaining > 0 ? (
              <RestTimerBar
                remainingSeconds={restSecondsRemaining}
                totalSeconds={restTimerTotalSeconds}
                isPaused={isRestTimerPaused}
                onTogglePause={() => setIsRestTimerPaused((current) => !current)}
                onAddTime={() => {
                  setRestSecondsRemaining((current) => current + REST_EXTENSION_SECONDS);
                  setRestTimerTotalSeconds((current) => current + REST_EXTENSION_SECONDS);
                }}
                onSkip={skipRestTimer}
              />
            ) : null}
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

function RestTimerBar({
  remainingSeconds,
  totalSeconds,
  isPaused,
  onTogglePause,
  onAddTime,
  onSkip,
}: {
  remainingSeconds: number;
  totalSeconds: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onAddTime: () => void;
  onSkip: () => void;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const progressTranslateX = useSharedValue(0);
  const previousStateRef = useRef({
    remainingSeconds,
    totalSeconds,
    isPaused,
    trackWidth: 0,
  });

  useEffect(() => {
    if (trackWidth <= 0) {
      return;
    }

    const previous = previousStateRef.current;
    const progressRatio = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
    const nextTranslateX = -trackWidth * (1 - progressRatio);
    const timerStarted = previous.remainingSeconds <= 0 && remainingSeconds > 0;
    const timerReset = remainingSeconds <= 0;
    const timerResumed = previous.isPaused && !isPaused;
    const timeExtended = remainingSeconds > previous.remainingSeconds || totalSeconds !== previous.totalSeconds;
    const trackWidthChanged = trackWidth !== previous.trackWidth;

    if (timerReset) {
      cancelAnimation(progressTranslateX);
      progressTranslateX.value = -trackWidth;
    } else if (timerStarted || timerResumed || timeExtended || trackWidthChanged || isPaused) {
      cancelAnimation(progressTranslateX);
      progressTranslateX.value = nextTranslateX;
      if (!isPaused) {
        progressTranslateX.value = withTiming(-trackWidth, {
          duration: remainingSeconds * 1000,
          easing: Easing.linear,
        });
      }
    }

    previousStateRef.current = {
      remainingSeconds,
      totalSeconds,
      isPaused,
      trackWidth,
    };
  }, [isPaused, progressTranslateX, remainingSeconds, totalSeconds, trackWidth]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progressTranslateX.value }],
  }));

  return (
    <View style={styles.restBar}>
      <View
        style={styles.restBarProgressTrack}
        onLayout={(event) => {
          setTrackWidth(event.nativeEvent.layout.width);
        }}
      >
        <Animated.View style={[styles.restBarProgressFill, animatedProgressStyle]} />
      </View>
      <View style={styles.restBarContent}>
        <Text style={styles.restBarLabel}>
          {t("workout.restTimer", { time: formatDuration(remainingSeconds) })}
        </Text>
        <View style={styles.restBarActions}>
          <RestTimerAction
            title={isPaused ? t("workout.restResume") : t("workout.restPause")}
            onPress={onTogglePause}
          />
          <RestTimerAction title={t("workout.restAddTime")} onPress={onAddTime} />
          <RestTimerAction title={t("workout.restSkip")} onPress={onSkip} />
        </View>
      </View>
    </View>
  );
}

function RestTimerAction({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.restActionButton,
        pressed && styles.restActionButtonPressed,
      ]}
      onPress={onPress}
    >
      <Text style={styles.restActionButtonText}>{title}</Text>
    </Pressable>
  );
}

function SetCard({
  data,
  unit,
  onChangeWeight,
  onChangeReps,
  onToggle,
  isCurrent,
  repsInputRef,
  editable = true,
}: {
  data: WorkoutSetType;
  unit: string;
  onChangeWeight: (v: string) => void;
  onChangeReps: (v: string) => void;
  onToggle: () => void;
  isCurrent: boolean;
  repsInputRef?: (node: TextInput | null) => void;
  editable?: boolean;
}) {
  return (
    <Card highlighted={editable && isCurrent}>
      <View style={styles.setHeader}>
        <View style={styles.setLabelRow}>
          <Text style={styles.setLabel}>{t("workout.setLabel", { set: data.setOrder + 1 })}</Text>
          {isCurrent && editable ? <Badge variant="today" label={t("workout.currentSet")} /> : null}
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
          ref={repsInputRef}
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
    paddingBottom: 180,
    gap: spacing["2xl"],
  },
  header: {
    gap: spacing.sm,
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
    gap: spacing.md,
  },
  restBar: {
    position: "relative",
    overflow: "hidden",
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  restBarProgressTrack: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surfaceMuted,
  },
  restBarProgressFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primarySoft,
  },
  restBarContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  restBarLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.accent,
  },
  restBarActions: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  restActionButton: {
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  restActionButtonPressed: {
    opacity: 0.8,
  },
  restActionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
});
