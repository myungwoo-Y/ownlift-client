import { useFocusEffect, useRouter } from "expo-router";
import type { SessionStubRecord } from "@ownlift/db";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge, Button, Card, colors, Divider, Section, spacing, Text } from "../../src/design";
import { getLiftLabel, getSessionLabel, getWeekLabel, t, useLocale } from "../../src/i18n";
import { useProgramStore } from "../../src/stores/program-store";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

const DRAG_DROP_FALLBACK_THRESHOLD = 0.45;

function findClosestIndex(centers: number[], target: number): number {
  if (centers.length === 0) return 0;

  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < centers.length; index += 1) {
    const distance = Math.abs(centers[index] - target);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  }
  return closestIndex;
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return items;

  const next = [...items];
  const [movedItem] = next.splice(fromIndex, 1);
  if (movedItem === undefined) return items;
  next.splice(toIndex, 0, movedItem);
  return next;
}

interface DraggableWeekRowProps {
  stub: SessionStubRecord;
  index: number;
  isToday: boolean;
  isCompleted: boolean;
  isDragging: boolean;
  staticShift: number;
  isAnyDragging: boolean;
  onOpenCompletedSession: (sessionId: string) => void;
  onDragBegin: (index: number, sessionId: string) => void;
  onDragMove: (dy: number) => void;
  onDragEnd: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
}

function DraggableWeekRow({
  stub,
  index,
  isToday,
  isCompleted,
  isDragging,
  staticShift,
  isAnyDragging,
  onOpenCompletedSession,
  onDragBegin,
  onDragMove,
  onDragEnd,
  onLayout,
}: DraggableWeekRowProps) {
  const dragTranslateY = useSharedValue(0);

  useEffect(() => {
    if (!isDragging) {
      dragTranslateY.value = 0;
    }
  }, [dragTranslateY, isDragging]);

  const dragAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dragTranslateY.value }],
  }));

  const handleGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(1)
        .onBegin(() => {
          dragTranslateY.value = 0;
          runOnJS(onDragBegin)(index, stub.sessionId);
        })
        .onUpdate((event) => {
          dragTranslateY.value = event.translationY;
          runOnJS(onDragMove)(event.translationY);
        })
        .onEnd(() => {
          dragTranslateY.value = withTiming(0, { duration: 120 });
          runOnJS(onDragEnd)();
        })
        .onFinalize(() => {
          dragTranslateY.value = withTiming(0, { duration: 120 });
          runOnJS(onDragEnd)();
        }),
    [dragTranslateY, index, onDragBegin, onDragEnd, onDragMove, stub.sessionId],
  );

  return (
    <Animated.View
      onLayout={onLayout}
      style={[
        styles.weekRow,
        isDragging && styles.weekRowDragging,
        isDragging
          ? dragAnimatedStyle
          : staticShift
            ? { transform: [{ translateY: staticShift }] }
            : null,
      ]}
    >
      <Pressable
        disabled={isAnyDragging}
        onPress={() => {
          if (isCompleted) {
            onOpenCompletedSession(stub.sessionId);
          }
        }}
      >
        <Card highlighted={isToday}>
          {isToday && (
            <View style={styles.todayLabel}>
              <Text style={styles.todayLabelText}>{t("status.today")}</Text>
            </View>
          )}
          <View style={styles.cardContent}>
            <View style={styles.cardLeft}>
              <Text variant="caption">
                {getSessionLabel(index)}
              </Text>
              <Text style={styles.liftName}>
                {getLiftLabel(stub.mainLiftKey)}
              </Text>
              <Text variant="caption">{t("plan.assistance")}</Text>
            </View>
            <View style={styles.cardRight}>
              <GestureDetector gesture={handleGesture}>
                <View
                  accessibilityLabel={t("plan.reorderHandleA11y")}
                  style={[styles.dragHandle, styles.dragHandleRight, isDragging && styles.dragHandleActive]}
                >
                  <Text style={styles.dragHandleText}>≡</Text>
                </View>
              </GestureDetector>
              <Badge
                variant={isCompleted ? "completed" : isToday ? "today" : "planned"}
                label={isCompleted ? t("status.completed") : isToday ? t("status.today") : t("status.planned")}
              />
            </View>
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  );
}

export default function PlanScreen() {
  useLocale();

  const router = useRouter();
  const { instance, currentWeekStubs, stubs, nextStub, isLoading, loadProgram, reorderCurrentWeek } =
    useProgramStore();
  const [orderedWeekStubs, setOrderedWeekStubs] = useState(currentWeekStubs);
  const [draggingSessionId, setDraggingSessionId] = useState<string | null>(null);
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null);
  const orderedWeekStubsRef = useRef(currentWeekStubs);
  const syncedWeekStubsRef = useRef(currentWeekStubs);
  const rowLayoutsRef = useRef<Record<string, { height: number; top: number }>>({});
  const dragActiveRef = useRef(false);
  const dragLastDyRef = useRef(0);
  const dragStartCenterYRef = useRef(0);
  const dragStartIndexRef = useRef(0);
  const dragStepRef = useRef(1);
  const dragTargetIndexRef = useRef<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      void loadProgram();
    }, [loadProgram]),
  );

  useEffect(() => {
    if (draggingSessionId !== null) {
      syncedWeekStubsRef.current = currentWeekStubs;
      return;
    }

    if (syncedWeekStubsRef.current !== currentWeekStubs) {
      orderedWeekStubsRef.current = currentWeekStubs;
      setOrderedWeekStubs(currentWeekStubs);
      syncedWeekStubsRef.current = currentWeekStubs;
    }
  }, [currentWeekStubs, draggingSessionId]);

  useEffect(() => {
    orderedWeekStubsRef.current = orderedWeekStubs;
  }, [orderedWeekStubs]);

  const persistWeekOrder = useCallback(
    async (nextOrder: typeof currentWeekStubs) => {
      try {
        await reorderCurrentWeek(nextOrder.map((stub) => stub.sessionId));
      } catch (error) {
        console.error("Failed to reorder sessions", error);
        void loadProgram();
      }
    },
    [loadProgram, reorderCurrentWeek],
  );

  const finishDrag = useCallback(
    () => {
      if (!dragActiveRef.current) return;
      dragActiveRef.current = false;

      const currentOrder = orderedWeekStubsRef.current;
      const maxIndex = currentOrder.length - 1;
      if (maxIndex < 0) {
        setDraggingSessionId(null);
        setDragTargetIndex(null);
        dragTargetIndexRef.current = null;
        return;
      }

      const fromIndex = clamp(dragStartIndexRef.current, 0, maxIndex);
      const targetIndex = dragTargetIndexRef.current;
      let toIndex = clamp(targetIndex ?? fromIndex, 0, maxIndex);
      if (toIndex === fromIndex) {
        const dragStep = dragStepRef.current || 1;
        const dragDistance = dragLastDyRef.current;
        if (Math.abs(dragDistance) >= dragStep * DRAG_DROP_FALLBACK_THRESHOLD) {
          toIndex = clamp(fromIndex + (dragDistance > 0 ? 1 : -1), 0, maxIndex);
        }
      }
      const changed = fromIndex !== toIndex;
      const nextOrder = changed ? moveItem(currentOrder, fromIndex, toIndex) : currentOrder;

      orderedWeekStubsRef.current = nextOrder;
      setOrderedWeekStubs(nextOrder);
      setDraggingSessionId(null);
      setDragTargetIndex(null);
      dragTargetIndexRef.current = null;
      dragLastDyRef.current = 0;

      if (changed) {
        void persistWeekOrder(nextOrder);
      }
    },
    [persistWeekOrder],
  );

  const handleDragBegin = useCallback(
    (index: number, sessionId: string) => {
      dragActiveRef.current = true;
      dragStartIndexRef.current = index;
      dragLastDyRef.current = 0;
      const activeLayout = rowLayoutsRef.current[sessionId];
      const fallbackStep = dragStepRef.current || 1;
      dragStartCenterYRef.current = activeLayout
        ? activeLayout.top + activeLayout.height / 2
        : index * fallbackStep + fallbackStep / 2;
      setDraggingSessionId(sessionId);
      setDragTargetIndex(index);
      dragTargetIndexRef.current = index;
    },
    [],
  );

  const handleDragMove = useCallback((dy: number) => {
    dragLastDyRef.current = dy;
    const currentOrder = orderedWeekStubsRef.current;
    const step = dragStepRef.current || 1;
    const draggedCenterY = dragStartCenterYRef.current + dy;
    const centers = currentOrder.map((currentStub, currentIndex) => {
      const layout = rowLayoutsRef.current[currentStub.sessionId];
      return layout ? layout.top + layout.height / 2 : currentIndex * step + step / 2;
    });
    const nextTargetIndex = clamp(
      findClosestIndex(centers, draggedCenterY),
      0,
      currentOrder.length - 1,
    );

    if (nextTargetIndex !== dragTargetIndexRef.current) {
      dragTargetIndexRef.current = nextTargetIndex;
      setDragTargetIndex(nextTargetIndex);
    }
  }, []);

  if (isLoading || !instance) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text variant="body">{t("plan.loadingProgram")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { state } = instance;
  const weekLabel = getWeekLabel(state.currentWeek);
  const completedCount = stubs.filter((s) => s.status === "completed").length;
  const totalCount = stubs.length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        scrollEnabled={draggingSessionId === null}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="title">{t("week.title", { week: state.currentWeek + 1 })}</Text>
            <Text variant="subtitle">{weekLabel}</Text>
          </View>
          <View style={styles.progressPill}>
            <Text style={styles.progressText}>
              {String(completedCount)}/{String(totalCount)}
            </Text>
          </View>
        </View>

        <Divider />

        {/* This Week */}
        <Section title={t("plan.section.thisWeek")}>
          <Text variant="caption" style={styles.reorderHint}>
            {t("plan.reorderHint")}
          </Text>
          {orderedWeekStubs.map((stub, index) => {
            const isToday = nextStub?.sessionId === stub.sessionId;
            const isCompleted = stub.status === "completed";
            const isDragging = draggingSessionId === stub.sessionId;
            const startIndex = dragStartIndexRef.current;
            const step = dragStepRef.current;
            let staticShift = 0;

            if (draggingSessionId && dragTargetIndex !== null && step > 0 && !isDragging) {
              if (startIndex < dragTargetIndex && index > startIndex && index <= dragTargetIndex) {
                staticShift = -step;
              } else if (startIndex > dragTargetIndex && index >= dragTargetIndex && index < startIndex) {
                staticShift = step;
              }
            }

            return (
              <DraggableWeekRow
                key={stub.sessionId}
                stub={stub}
                index={index}
                isToday={isToday}
                isCompleted={isCompleted}
                isDragging={isDragging}
                staticShift={staticShift}
                isAnyDragging={draggingSessionId !== null}
                onOpenCompletedSession={(sessionId) => {
                  router.push(`/session/${sessionId}`);
                }}
                onDragBegin={handleDragBegin}
                onDragMove={handleDragMove}
                onDragEnd={finishDrag}
                onLayout={(event) => {
                  rowLayoutsRef.current[stub.sessionId] = {
                    top: event.nativeEvent.layout.y,
                    height: event.nativeEvent.layout.height,
                  };
                  const rowStep = event.nativeEvent.layout.height + spacing.md;
                  if (rowStep > 0) {
                    dragStepRef.current = rowStep;
                  }
                }}
              />
            );
          })}
        </Section>

        {/* Upcoming */}
        {state.currentWeek < 3 && (
          <Section title={t("plan.section.upcoming")}>
            <Card>
              <View style={styles.upcomingRow}>
                <View>
                  <Text style={styles.upcomingTitle}>
                    {t("week.title", { week: state.currentWeek + 2 })}
                  </Text>
                  <Text variant="caption">
                    {t("plan.andMore", { lift: getLiftLabel(instance.params.liftOrder[0] ?? "") })}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
            </Card>
          </Section>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      {nextStub && (
        <View style={styles.ctaContainer}>
          <Divider />
          <View style={styles.ctaPadding}>
            <Button
              title={t("plan.startTodayWorkout")}
              onPress={() => router.push(`/workout/${nextStub.sessionId}`)}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing["2xl"],
    paddingBottom: 120,
    gap: spacing["2xl"],
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: spacing["2xl"],
  },
  progressPill: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  todayLabel: {
    position: "absolute",
    top: -10,
    left: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  todayLabelText: {
    color: colors.primaryForeground,
    fontSize: 11,
    fontWeight: "700",
  },
  reorderHint: {
    marginTop: -spacing.xs,
  },
  weekRow: {
    zIndex: 0,
  },
  weekRowDragging: {
    zIndex: 20,
    elevation: 6,
    opacity: 0.96,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  cardLeft: {
    flex: 1,
    gap: 2,
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dragHandle: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minWidth: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  dragHandleRight: {
    marginLeft: spacing.xs,
  },
  dragHandleActive: {
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  dragHandleText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "700",
    lineHeight: 16,
  },
  liftName: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  upcomingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  upcomingTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  chevron: {
    fontSize: 24,
    color: colors.textTertiary,
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
