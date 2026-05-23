import { updateStubStatus } from "@ownlift/db";
import type { PrescriptionData } from "@ownlift/schemas";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  TouchableOpacity as BottomSheetTouchableOpacity,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState, type ComponentRef } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  findNodeHandle,
  type DimensionValue,
  type TextInput,
} from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Badge,
  borderRadius,
  Button,
  Card,
  colors,
  Divider,
  FLOATING_NAV_CONTENT_TOP_OFFSET,
  FloatingBackNav,
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
  const [isCompletingWarmups, setIsCompletingWarmups] = useState(false);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(0);
  const [restTimerTotalSeconds, setRestTimerTotalSeconds] = useState(0);
  const [isRestTimerPaused, setIsRestTimerPaused] = useState(false);
  const restTimerSheetRef = useRef<ComponentRef<typeof BottomSheetModal>>(null);
  const repsInputRefs = useRef(new Map<string, TextInput | null>());
  const focusedRepsSetIdRef = useRef<string | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [ctaHeight, setCtaHeight] = useState(0);

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
    setIsCompletingWarmups(false);
    setRestSecondsRemaining(0);
    setRestTimerTotalSeconds(0);
    setIsRestTimerPaused(false);
    restTimerSheetRef.current?.dismiss();
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

  const currentSet = isWorkoutActive
    ? sets.find((item) => !item.isCompleted) ?? null
    : null;
  const currentSetId = currentSet?.id ?? null;
  const shouldAutoFocusCurrentSet = isWorkoutActive && currentSet?.isAmrap === true;
  const scrollContentBottomPadding = Math.max(
    spacing["3xl"],
    ctaHeight + spacing["4xl"],
  );

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
    if (restSecondsRemaining <= 0) {
      restTimerSheetRef.current?.dismiss();
    }
  }, [restSecondsRemaining]);

  const scrollInputIntoView = useCallback((input: TextInput | null, delayMs = 80) => {
    const inputHandle = findNodeHandle(input);
    const scrollResponder = scrollViewRef.current?.getScrollResponder?.() as
      | {
          scrollResponderScrollNativeHandleToKeyboard?: (
            nodeHandle: number,
            additionalOffset?: number,
            preventNegativeScrollOffset?: boolean,
          ) => void;
        }
      | undefined;

    if (!inputHandle || !scrollResponder?.scrollResponderScrollNativeHandleToKeyboard) {
      return;
    }

    setTimeout(() => {
      scrollResponder.scrollResponderScrollNativeHandleToKeyboard?.(
        inputHandle,
        ctaHeight + spacing["2xl"],
        true,
      );
    }, delayMs);
  }, [ctaHeight]);

  const scrollFocusedRepsInputIntoView = useCallback(() => {
    const focusedSetId = focusedRepsSetIdRef.current;
    if (!focusedSetId) return;

    scrollInputIntoView(repsInputRefs.current.get(focusedSetId) ?? null, 0);
  }, [scrollInputIntoView]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", scrollFocusedRepsInputIntoView);
    const frameSubscription = Platform.OS === "ios"
      ? Keyboard.addListener("keyboardDidChangeFrame", scrollFocusedRepsInputIntoView)
      : null;

    return () => {
      showSubscription.remove();
      frameSubscription?.remove();
    };
  }, [scrollFocusedRepsInputIntoView]);

  useEffect(() => {
    if (!shouldAutoFocusCurrentSet || !currentSetId) return;

    const timeout = setTimeout(() => {
      focusedRepsSetIdRef.current = currentSetId;
      const input = repsInputRefs.current.get(currentSetId) ?? null;
      input?.focus();
      scrollInputIntoView(input);
    }, 150);

    return () => {
      clearTimeout(timeout);
    };
  }, [currentSetId, scrollInputIntoView, shouldAutoFocusCurrentSet]);

  const startRestTimer = (seconds: number) => {
    setRestSecondsRemaining(seconds);
    setRestTimerTotalSeconds(seconds);
    setIsRestTimerPaused(false);
  };

  const handleRepsInputFocus = useCallback((setId: string) => {
    focusedRepsSetIdRef.current = setId;
    scrollInputIntoView(repsInputRefs.current.get(setId) ?? null);
  }, [scrollInputIntoView]);

  const presentRestTimerSheet = useCallback(() => {
    restTimerSheetRef.current?.present();
  }, []);

  const renderRestTimerBackdrop = useCallback((props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={0.48}
      pressBehavior="close"
    />
  ), []);

  const skipRestTimer = () => {
    setRestSecondsRemaining(0);
    setRestTimerTotalSeconds(0);
    setIsRestTimerPaused(false);
    restTimerSheetRef.current?.dismiss();
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
  const visibleSets = isWorkoutActive
    ? sets
    : prescription.sets
        .map(toPreviewSetState);
  const workoutCompletedCount = visibleSets.filter((item) => item.isCompleted).length;
  const workoutTotalCount = visibleSets.length;
  const workoutProgressPercentage = Math.round((workoutCompletedCount / Math.max(workoutTotalCount, 1)) * 100);
  const allSetsCompleted = sets.every((item) => item.isCompleted);
  const warmupSets = visibleSets.filter((setData) => setData.prescribed.isWarmup);
  const workSets = visibleSets.filter((setData) => !setData.prescribed.isWarmup);
  const incompleteWarmupSets = warmupSets.filter((setData) => !setData.isCompleted);
  const shouldShowRestTimer = isWorkoutActive && restSecondsRemaining > 0;
  const shouldShowStartWorkoutButton = !isWorkoutActive && canStartTodayWorkout;
  const shouldShowBottomControls = shouldShowStartWorkoutButton || isWorkoutActive;
  const effectiveScrollContentBottomPadding = shouldShowBottomControls
    ? scrollContentBottomPadding
    : spacing["3xl"];
  const canCompleteWarmups = isWorkoutActive &&
    !isSubmitting &&
    !isCompletingWarmups &&
    incompleteWarmupSets.length > 0;

  const handleComplete = async () => {
    if (isSubmitting || !sessionId || !isWorkoutActive) return;

    try {
      setIsSubmitting(true);
      await completeWorkout();
      await completeSession(sessionId);
      void loadProgram().catch((error) => {
        console.error("Failed to refresh program after completion:", error);
      });
      router.replace({
        pathname: "/workout/complete",
        params: { sessionId },
      });
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

  const handleToggleSet = async (setData: WorkoutSetType): Promise<boolean> => {
    if (!isWorkoutActive) return false;

    const nextCompleted = !setData.isCompleted;
    const actualReps = parseInt(setData.actualReps, 10);

    if (nextCompleted && setData.isAmrap && (!Number.isFinite(actualReps) || actualReps <= 0)) {
      Alert.alert(
        t("workout.amrapRepsRequiredTitle"),
        t("workout.amrapRepsRequiredMessage"),
      );
      repsInputRefs.current.get(setData.id)?.focus();
      return false;
    }

    const willHaveRemainingSets = sets.some((item) => item.id !== setData.id && !item.isCompleted);

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleSetComplete(setData.id);

    if (!nextCompleted) {
      skipRestTimer();
    }

    if (nextCompleted && !setData.prescribed.isWarmup) {
      if (setData.isAmrap || !willHaveRemainingSets) {
        skipRestTimer();
      } else if (defaultRestTimerSeconds > 0) {
        startRestTimer(defaultRestTimerSeconds);
      }
    }

    return true;
  };

  const handleCompleteWarmups = async () => {
    if (!canCompleteWarmups) return;

    try {
      setIsCompletingWarmups(true);
      skipRestTimer();
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      for (const setData of incompleteWarmupSets) {
        await toggleSetComplete(setData.id);
      }
    } catch (error) {
      console.error("Failed to complete warm-up sets:", error);
      Alert.alert(
        t("workout.errorWarmupCompleteTitle"),
        t("workout.errorWarmupCompleteMessage"),
      );
    } finally {
      setIsCompletingWarmups(false);
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

  const workoutCompleteButtonTitle = isSubmitting
    ? t("workout.saving")
    : t("workout.completeWorkout");
  const startWorkoutButtonTitle = isStarting
    ? t("workout.starting")
    : t("workout.startWorkout");

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <FloatingBackNav
          onPress={confirmExit}
          disabled={isSubmitting || isStarting}
          accessibilityLabel={t("common.back")}
        >
          {shouldShowRestTimer ? (
            <RestTimerBar
              remainingSeconds={restSecondsRemaining}
              totalSeconds={restTimerTotalSeconds}
              isPaused={isRestTimerPaused}
              onPress={presentRestTimerSheet}
            />
          ) : null}
        </FloatingBackNav>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.container,
            { paddingBottom: effectiveScrollContentBottomPadding },
          ]}
          scrollIndicatorInsets={{ bottom: effectiveScrollContentBottomPadding }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        >
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
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>{t("workout.progress.current")}</Text>
              <Text style={styles.progressValue}>
                {String(workoutCompletedCount)}/{String(workoutTotalCount)}
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${workoutProgressPercentage}%` as DimensionValue },
                ]}
              />
            </View>
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
            <Section
              title={t("workout.section.warmupSets")}
              headerAccessory={isWorkoutActive ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("workout.warmupCompleteAll")}
                  disabled={!canCompleteWarmups}
                  onPress={() => void handleCompleteWarmups()}
                  style={({ pressed }) => [
                    styles.warmupShortcutButton,
                    pressed && canCompleteWarmups ? styles.warmupShortcutButtonPressed : null,
                    !canCompleteWarmups ? styles.warmupShortcutButtonDisabled : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.warmupShortcutText,
                      !canCompleteWarmups ? styles.warmupShortcutTextDisabled : null,
                    ]}
                  >
                    {isCompletingWarmups
                      ? t("workout.warmupCompleting")
                      : incompleteWarmupSets.length > 0
                        ? t("workout.warmupCompleteAll")
                        : t("workout.warmupCompleteAllDone")}
                  </Text>
                </Pressable>
              ) : null}
            >
              {warmupSets.map((setData) => (
                <SetCard
                  key={setData.id}
                  data={setData}
                  unit={instance.params.unit}
                  editable={isWorkoutActive}
                  canToggle={isWorkoutActive && (setData.isCompleted || currentSetId === setData.id)}
                  isCurrent={currentSetId === setData.id}
                  repsInputRef={(node) => {
                    repsInputRefs.current.set(setData.id, node);
                  }}
                  onRepsFocus={() => handleRepsInputFocus(setData.id)}
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
                canToggle={isWorkoutActive && (setData.isCompleted || currentSetId === setData.id)}
                isCurrent={currentSetId === setData.id}
                repsInputRef={(node) => {
                  repsInputRefs.current.set(setData.id, node);
                }}
                onRepsFocus={() => handleRepsInputFocus(setData.id)}
                onChangeWeight={(value) => updateSet(setData.id, "actualWeight", value)}
                onChangeReps={(value) => updateSet(setData.id, "actualReps", value)}
                onToggle={() => void handleToggleSet(setData)}
              />
            ))}
          </Section>

        </ScrollView>

        {shouldShowBottomControls ? (
          <View
            style={styles.ctaContainer}
            onLayout={(event) => {
              setCtaHeight(event.nativeEvent.layout.height);
            }}
          >
            <View pointerEvents="none" style={styles.ctaFadeArea}>
              <Svg
                width="100%"
                height="100%"
                style={StyleSheet.absoluteFill}
                preserveAspectRatio="none"
              >
                <Defs>
                  <SvgLinearGradient id="ctaFade" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={colors.background} stopOpacity="0" />
                    <Stop offset="100%" stopColor={colors.background} stopOpacity="1" />
                  </SvgLinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#ctaFade)" />
              </Svg>
            </View>
            <View style={styles.ctaPadding}>
              <Button
                title={isWorkoutActive ? workoutCompleteButtonTitle : startWorkoutButtonTitle}
                onPress={isWorkoutActive ? confirmComplete : () => void handleStartWorkout()}
                disabled={isWorkoutActive ? isSubmitting : isStarting}
              />
            </View>
          </View>
        ) : null}
        <BottomSheetModal
          ref={restTimerSheetRef}
          enableDynamicSizing
          enablePanDownToClose
          backdropComponent={renderRestTimerBackdrop}
          backgroundStyle={styles.timerSheetBackground}
          handleIndicatorStyle={styles.timerSheetHandleIndicator}
        >
          <BottomSheetView style={styles.timerSheetContent}>
            <Text style={styles.timerSheetTitle}>
              {t("workout.restTimer", { time: formatDuration(restSecondsRemaining) })}
            </Text>
            <View style={styles.timerSheetActions}>
              <TimerSheetAction
                title={isRestTimerPaused ? t("workout.restResume") : t("workout.restPause")}
                variant="primary"
                onPress={() => setIsRestTimerPaused((current) => !current)}
              />
              <TimerSheetAction
                title={t("workout.restAddTime")}
                onPress={() => {
                  setRestSecondsRemaining((current) => current + REST_EXTENSION_SECONDS);
                  setRestTimerTotalSeconds((current) => current + REST_EXTENSION_SECONDS);
                }}
              />
              <TimerSheetAction
                title={t("workout.restSkip")}
                onPress={skipRestTimer}
              />
            </View>
          </BottomSheetView>
        </BottomSheetModal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RestTimerBar({
  remainingSeconds,
  totalSeconds,
  isPaused,
  onPress,
}: {
  remainingSeconds: number;
  totalSeconds: number;
  isPaused: boolean;
  onPress: () => void;
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
    <Pressable
      style={({ pressed }) => [
        styles.restBar,
        pressed && styles.restBarPressed,
      ]}
      onPress={onPress}
    >
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
        {isPaused ? (
          <Text style={styles.restBarStatus}>{t("workout.restPausedStatus")}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function TimerSheetAction({
  title,
  variant = "secondary",
  onPress,
}: {
  title: string;
  variant?: "primary" | "secondary";
  onPress: () => void;
}) {
  return (
    <BottomSheetTouchableOpacity
      activeOpacity={0.84}
      style={[
        styles.timerSheetAction,
        variant === "primary" && styles.timerSheetActionPrimary,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.timerSheetActionText,
          variant === "primary" && styles.timerSheetActionPrimaryText,
        ]}
      >
        {title}
      </Text>
    </BottomSheetTouchableOpacity>
  );
}

function SetCard({
  data,
  unit,
  onChangeWeight,
  onChangeReps,
  onToggle,
  isCurrent,
  canToggle,
  repsInputRef,
  onRepsFocus,
  editable = true,
}: {
  data: WorkoutSetType;
  unit: string;
  onChangeWeight: (v: string) => void;
  onChangeReps: (v: string) => void;
  onToggle: () => void;
  isCurrent: boolean;
  canToggle: boolean;
  repsInputRef?: (node: TextInput | null) => void;
  onRepsFocus?: () => void;
  editable?: boolean;
}) {
  const isCurrentSet = editable && isCurrent;

  return (
    <Card
      highlighted={isCurrentSet}
      style={[
        data.isCompleted && styles.completedSetCard,
        isCurrentSet && styles.currentSetCard,
      ]}
    >
      <View style={styles.setHeader}>
        <View style={styles.setLabelRow}>
          <Text style={styles.setLabel}>{t("workout.setLabel", { set: data.setOrder + 1 })}</Text>
          {editable ? (
            <View
              style={!isCurrentSet && styles.hiddenCurrentSetBadge}
              pointerEvents="none"
              accessibilityElementsHidden={!isCurrentSet}
              importantForAccessibility={isCurrentSet ? "auto" : "no-hide-descendants"}
            >
              <Badge variant="today" label={t("workout.currentSet")} />
            </View>
          ) : null}
          {data.isAmrap ? <Badge variant="amrap" label={t("badge.amrap")} /> : null}
        </View>
        <Text variant="caption">
          {String(data.prescribed.targetWeight)}{unit} × {String(data.prescribed.targetReps)}
        </Text>
      </View>

      <View style={styles.setInputRow}>
        <View style={styles.setInputGroup}>
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
            onFocus={onRepsFocus}
          />
        </View>
        <Pressable
          style={[
            styles.checkButton,
            data.isCompleted && styles.checkButtonActive,
            !canToggle && styles.checkButtonDisabled,
          ]}
          onPress={onToggle}
          disabled={!canToggle}
        >
          <Text
            style={[
              styles.checkMark,
              data.isCompleted && styles.checkMarkActive,
            ]}
          >
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
  keyboardAvoiding: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing["2xl"],
    paddingTop: FLOATING_NAV_CONTENT_TOP_OFFSET,
    paddingBottom: spacing["3xl"],
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
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  progressValue: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
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
  previewNotice: {
    gap: spacing.xs,
  },
  previewNoticeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  warmupShortcutButton: {
    minHeight: 44,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  warmupShortcutButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
  warmupShortcutButtonDisabled: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  warmupShortcutText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  warmupShortcutTextDisabled: {
    color: colors.textTertiary,
  },
  currentSetCard: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  completedSetCard: {
    borderWidth: 1,
    borderColor: "rgba(214, 255, 96, 0.28)",
    backgroundColor: "rgba(214, 255, 96, 0.05)",
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
  hiddenCurrentSetBadge: {
    opacity: 0,
  },
  setInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  setInputGroup: {
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
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  checkButtonActive: {
    backgroundColor: colors.primarySoft,
    borderColor: "rgba(214, 255, 96, 0.38)",
  },
  checkButtonDisabled: {
    opacity: 0.45,
  },
  checkMark: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  checkMarkActive: {
    color: colors.accent,
  },
  ctaContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  ctaFadeArea: {
    height: 88,
  },
  ctaPadding: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing["2xl"],
    paddingTop: 0,
    paddingBottom: spacing["3xl"],
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
  restBarPressed: {
    opacity: 0.9,
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
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  restBarLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.accent,
  },
  restBarStatus: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  timerSheetBackground: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  timerSheetHandleIndicator: {
    width: 44,
    backgroundColor: colors.borderStrong,
  },
  timerSheetContent: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.sm,
    paddingBottom: spacing["3xl"],
    gap: spacing.lg,
  },
  timerSheetTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  timerSheetActions: {
    gap: spacing.md,
  },
  timerSheetAction: {
    minHeight: 52,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.md,
  },
  timerSheetActionPrimary: {
    backgroundColor: colors.primary,
  },
  timerSheetActionText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  timerSheetActionPrimaryText: {
    color: colors.primaryForeground,
  },
});
