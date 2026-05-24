import { clearSetLogsForSession, updateStubStatus } from "@ownlift/db";
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
import { Check } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState, type ComponentRef } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput as RNTextInput,
  View,
  findNodeHandle,
  type TextInput,
} from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  borderRadius,
  Button,
  Card,
  colors,
  FLOATING_NAV_CONTENT_TOP_OFFSET,
  FloatingBackNav,
  fontSize,
  fontWeight,
  spacing,
  Text,
  Badge,
} from "../../src/design";
import { getLiftLabel, t, useLocale } from "../../src/i18n";
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

function sanitizeReps(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

function sanitizeWeight(value: string): string {
  const clean = value.replace(/[^0-9.]/g, "");
  const parts = clean.split(".");
  return parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : clean;
}

export default function WorkoutScreen() {
  useLocale();

  const params = useLocalSearchParams<{ sessionId?: string | string[]; autostart?: string | string[] }>();
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;
  const autostart = Array.isArray(params.autostart) ? params.autostart[0] : params.autostart;
  const router = useRouter();
  const { instance, stubs, todayStub, completeSession, loadProgram } = useProgramStore();
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
  const lastSetId = isWorkoutActive && sets.length > 0
    ? sets[sets.length - 1]?.id ?? null
    : null;
  const shouldAutoFocusCurrentSet = isWorkoutActive && currentSet?.isAmrap === true;
  const scrollContentBottomPadding = Math.max(
    spacing["3xl"],
    ctaHeight + spacing["4xl"],
  );

  const scrollToWorkoutBottom = useCallback((delayMs = 80) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, delayMs);
  }, []);

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
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      if (focusedRepsSetIdRef.current === lastSetId) {
        scrollToWorkoutBottom(0);
      }
    });

    return () => {
      showSubscription.remove();
      frameSubscription?.remove();
      hideSubscription.remove();
    };
  }, [lastSetId, scrollFocusedRepsInputIntoView, scrollToWorkoutBottom]);

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

  const handleRepsSubmitEditing = useCallback((setId: string) => {
    focusedRepsSetIdRef.current = setId;

    if (setId === lastSetId) {
      scrollToWorkoutBottom();
    }
  }, [lastSetId, scrollToWorkoutBottom]);

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

  const visibleSets = isWorkoutActive
    ? sets
    : prescription.sets
        .map(toPreviewSetState);
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

    if (nextCompleted && !willHaveRemainingSets) {
      Keyboard.dismiss();
      scrollToWorkoutBottom(120);
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

  const handleExitWorkout = async () => {
    try {
      if (sessionId) {
        await clearSetLogsForSession(sessionId);
        await updateStubStatus({ sessionId, status: "planned" });
        void loadProgram();
      }
    } catch (error) {
      console.error("Failed to discard workout on exit:", error);
    } finally {
      goBack();
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
        { text: t("workout.exit"), style: "destructive", onPress: () => void handleExitWorkout() },
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
          includeTopInset={false}
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
            <Text style={styles.workoutTitle} adjustsFontSizeToFit numberOfLines={1}>
              {getLiftLabel(stub.mainLiftKey)}
            </Text>
            <Text style={styles.workoutWeek}>
              {t("week.title", { week: stub.weekIndex + 1 })}
            </Text>
          </View>

          {!isWorkoutActive ? (
            <Card>
              <View style={styles.previewNotice}>
                <Text style={styles.previewNoticeTitle}>
                  {canStartTodayWorkout
                    ? t("workout.readyToStart")
                    : t("workout.onlyTodayCanStart")}
                </Text>
              </View>
            </Card>
          ) : null}

          {warmupSets.length > 0 ? (
            <View style={styles.setGroup}>
              <View style={styles.setGroupHeader}>
                <Text style={styles.setGroupTitle}>{t("workout.section.warmupSets")}</Text>
                {isWorkoutActive ? (
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
              </View>
              <SetTableHeader showStatus={isWorkoutActive} />
              {warmupSets.map((setData, index) => (
                <SetCard
                  key={setData.id}
                  data={setData}
                  displaySetNumber={index + 1}
                  unit={instance.params.unit}
                  editable={isWorkoutActive}
                  canToggle={isWorkoutActive && (setData.isCompleted || currentSetId === setData.id)}
                  isCurrent={currentSetId === setData.id}
                  repsInputRef={(node) => {
                    repsInputRefs.current.set(setData.id, node);
                  }}
                  onRepsFocus={() => handleRepsInputFocus(setData.id)}
                  onRepsSubmitEditing={() => handleRepsSubmitEditing(setData.id)}
                  onChangeWeight={(value) => updateSet(setData.id, "actualWeight", sanitizeWeight(value))}
                  onChangeReps={(value) => updateSet(setData.id, "actualReps", sanitizeReps(value))}
                  onToggle={() => void handleToggleSet(setData)}
                />
              ))}
            </View>
          ) : null}

          <View style={styles.setGroup}>
            {warmupSets.length > 0 ? (
              <View style={styles.setGroupHeader}>
                <Text style={[styles.setGroupTitle, styles.workSetsTitle]}>
                  {t("workout.section.workSets")}
                </Text>
              </View>
            ) : null}
            <SetTableHeader showStatus={isWorkoutActive} />
            {workSets.map((setData, index) => (
              <SetCard
                key={setData.id}
                data={setData}
                displaySetNumber={index + 1}
                unit={instance.params.unit}
                editable={isWorkoutActive}
                canToggle={isWorkoutActive && (setData.isCompleted || currentSetId === setData.id)}
                isCurrent={currentSetId === setData.id}
                repsInputRef={(node) => {
                  repsInputRefs.current.set(setData.id, node);
                }}
                onRepsFocus={() => handleRepsInputFocus(setData.id)}
                onRepsSubmitEditing={() => handleRepsSubmitEditing(setData.id)}
                onChangeWeight={(value) => updateSet(setData.id, "actualWeight", sanitizeWeight(value))}
                onChangeReps={(value) => updateSet(setData.id, "actualReps", sanitizeReps(value))}
                onToggle={() => void handleToggleSet(setData)}
              />
            ))}
          </View>

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

function SetTableHeader({ showStatus }: { showStatus: boolean }) {
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
      {showStatus ? <View style={styles.statusColumn} /> : null}
    </View>
  );
}

function SetMetricInput({
  value,
  unit,
  onChangeText,
  editable,
  muted,
  metric,
  inputRef,
  onFocus,
  onSubmitEditing,
  onBlur,
  highlighted,
}: {
  value: string;
  unit: string;
  onChangeText: (v: string) => void;
  editable: boolean;
  muted: boolean;
  metric: "weight" | "reps";
  inputRef?: (node: TextInput | null) => void;
  onFocus?: () => void;
  onSubmitEditing?: () => void;
  onBlur?: () => void;
  highlighted?: boolean;
}) {
  return (
    <View style={styles.metricGroup}>
      <RNTextInput
        ref={inputRef}
        style={[
          styles.metricInput,
          metric === "weight" ? styles.metricInputWeight : styles.metricInputReps,
          muted ? styles.metricInputMuted : null,
          highlighted ? styles.metricInputHighlighted : null,
        ]}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onSubmitEditing={onSubmitEditing}
        onBlur={onBlur}
        keyboardType="numeric"
        selectionColor={colors.primary}
        editable={editable}
        selectTextOnFocus
      />
      <Text
        style={[
          styles.metricUnit,
          muted ? styles.metricUnitMuted : null,
          highlighted ? styles.metricUnitHighlighted : null,
        ]}
      >
        {unit}
      </Text>
    </View>
  );
}

function SetCard({
  data,
  displaySetNumber,
  unit,
  onChangeWeight,
  onChangeReps,
  onToggle,
  isCurrent,
  canToggle,
  repsInputRef,
  onRepsFocus,
  onRepsSubmitEditing,
  editable = true,
}: {
  data: WorkoutSetType;
  displaySetNumber: number;
  unit: string;
  onChangeWeight: (v: string) => void;
  onChangeReps: (v: string) => void;
  onToggle: () => void;
  isCurrent: boolean;
  canToggle: boolean;
  repsInputRef?: (node: TextInput | null) => void;
  onRepsFocus?: () => void;
  onRepsSubmitEditing?: () => void;
  editable?: boolean;
}) {
  const isCurrentSet = editable && isCurrent;
  const isMuted = !data.isCompleted && !isCurrentSet;
  const checkColor = data.isCompleted
    ? colors.primaryForeground
    : isCurrentSet
      ? colors.primary
      : colors.textTertiary;

  const handleRepsBlur = () => {
    const reps = parseInt(data.actualReps, 10);
    if (!data.isCompleted && Number.isFinite(reps) && reps > 0) {
      onToggle();
    }
  };

  return (
    <Card
      highlighted={isCurrentSet}
      style={[
        styles.setRowCard,
        data.isCompleted && styles.completedSetCard,
        isCurrentSet && styles.currentSetCard,
      ]}
    >
      {data.isAmrap && (
        <View style={styles.cardTopBadgeContainer}>
          <Badge variant="amrap" label={t("badge.amrap")} size="compact" />
        </View>
      )}
      <View style={styles.setRowContent}>
        <View style={styles.setNumberColumn}>
          <Text
            style={[
              styles.setNumber,
              (data.isCompleted || isCurrentSet) ? styles.setNumberActive : styles.setNumberMuted,
            ]}
          >
            {String(displaySetNumber)}
          </Text>
        </View>
        <View style={styles.weightColumn}>
          <SetMetricInput
            value={data.actualWeight}
            onChangeText={onChangeWeight}
            unit={unit}
            editable={editable}
            muted={isMuted}
            metric="weight"
          />
        </View>
        <View style={styles.repsColumn}>
          <SetMetricInput
            value={data.actualReps}
            onChangeText={onChangeReps}
            unit={`${t("unit.reps")}${!editable && data.isAmrap ? "+" : ""}`}
            editable={editable}
            muted={isMuted}
            metric="reps"
            inputRef={repsInputRef}
            onFocus={onRepsFocus}
            onSubmitEditing={onRepsSubmitEditing}
            onBlur={handleRepsBlur}
            highlighted={data.isAmrap && data.actualReps.trim().length > 0}
          />
        </View>
        {editable ? (
          <View style={styles.statusColumn}>
            <Pressable
              style={[
                styles.checkButton,
                data.isCompleted && styles.checkButtonActive,
                isCurrentSet && !data.isCompleted ? styles.checkButtonCurrent : null,
                !canToggle && styles.checkButtonDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t("workout.setLabel", { set: displaySetNumber })}
              onPress={onToggle}
              disabled={!canToggle}
            >
              <Check size={28} strokeWidth={2.6} color={checkColor} />
            </Pressable>
          </View>
        ) : null}
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
    gap: spacing.xs,
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
  setGroup: {
    gap: spacing.md,
  },
  setGroupHeader: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  setGroupTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  workSetsTitle: {
    color: colors.primary,
  },
  setTableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  setTableHeaderText: {
    fontSize: fontSize.md,
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
  statusColumn: {
    width: 56,
    alignItems: "center",
  },
  setRowCard: {
    minHeight: 88,
    padding: 0,
    justifyContent: "center",
  },
  currentSetCard: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  completedSetCard: {
  },
  setRowContent: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  setNumber: {
    fontSize: fontSize["2xl"],
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
  metricInput: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    fontSize: fontSize["2xl"],
    fontFamily: "Inter_500Medium",
    color: colors.text,
    textAlign: "right",
  },
  metricInputWeight: {
    width: 52,
  },
  metricInputReps: {
    width: 32,
  },
  metricInputMuted: {
    color: colors.textSecondary,
  },
  metricInputHighlighted: {
    color: colors.primary,
  },
  cardTopBadgeContainer: {
    position: "absolute",
    top: -9,
    left: 20,
    zIndex: 10,
  },
  metricUnit: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  metricUnitMuted: {
    color: colors.textTertiary,
  },
  metricUnitHighlighted: {
    color: colors.primary,
  },
  checkButton: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  checkButtonActive: {
    backgroundColor: colors.primary,
  },
  checkButtonCurrent: {
    backgroundColor: colors.transparent,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  checkButtonDisabled: {
    backgroundColor: colors.transparent,
    borderWidth: 1,
    borderColor: colors.textTertiary,
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
