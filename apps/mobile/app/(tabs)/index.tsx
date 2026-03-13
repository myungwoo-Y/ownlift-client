import type { SessionStubRecord } from "@ownlift/db";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { type SharedValue, runOnJS, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge, borderRadius, Button, Card, colors, Divider, Section, spacing, Text } from "../../src/design";
import { getLiftLabel, getWeekLabel, t, useLocale } from "../../src/i18n";
import { useProgramStore } from "../../src/stores/program-store";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

const REORDER_OVERLAP_THRESHOLD = 0.4;
const FALLBACK_ROW_HEIGHT = 128;
const squatThumbnailSource = require("../../assets/images/squat_3d.png");
const benchThumbnailSource = require("../../assets/images/bench_press_3d.png");
const deadliftThumbnailSource = require("../../assets/images/deadlift_3d.png");
const pressThumbnailSource = require("../../assets/images/ohp_3d.png");

function getLiftThumbnailSource(mainLiftKey: SessionStubRecord["mainLiftKey"]) {
  if (mainLiftKey === "squat") return squatThumbnailSource;
  if (mainLiftKey === "bench") return benchThumbnailSource;
  if (mainLiftKey === "deadlift") return deadliftThumbnailSource;
  if (mainLiftKey === "press") return pressThumbnailSource;
  return null;
}

type PanGesture = ReturnType<typeof Gesture.Pan>;

interface WeekRowCardProps {
  stub: SessionStubRecord;
  isToday: boolean;
  isCompleted: boolean;
  isDragging: boolean;
  isAnyDragging: boolean;
  gesture?: PanGesture;
  onPress?: (stub: SessionStubRecord) => void;
}

function WeekRowCard({
  stub,
  isToday,
  isCompleted,
  isDragging,
  isAnyDragging,
  gesture,
  onPress,
}: WeekRowCardProps) {
  const thumbnailSource = getLiftThumbnailSource(stub.mainLiftKey);

  const content = (
    <Card highlighted={isToday}>
      {isToday && (
        <View style={styles.todayLabel}>
          <Text style={styles.todayLabelText}>{t("status.today")}</Text>
        </View>
      )}
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          {thumbnailSource ? (
            <View style={styles.thumbnailFrame}>
              <Image
                source={thumbnailSource}
                contentFit="cover"
                style={styles.thumbnailImage}
              />
            </View>
          ) : null}
          <View style={styles.cardText}>
            <Text style={styles.liftName}>
              {getLiftLabel(stub.mainLiftKey)}
            </Text>
            <Text variant="caption">{t("plan.assistance")}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          {gesture ? (
            <GestureDetector gesture={gesture}>
              <View
                accessibilityLabel={t("plan.reorderHandleA11y")}
                style={[styles.dragHandle, styles.dragHandleRight, isDragging && styles.dragHandleActive]}
              >
                <Text style={styles.dragHandleText}>≡</Text>
              </View>
            </GestureDetector>
          ) : (
            <View style={[styles.dragHandle, styles.dragHandleRight, isDragging && styles.dragHandleActive]}>
              <Text style={styles.dragHandleText}>≡</Text>
            </View>
          )}
          <Badge
            variant={isCompleted ? "completed" : isToday ? "today" : "planned"}
            label={isCompleted ? t("status.completed") : isToday ? t("status.today") : t("status.planned")}
          />
        </View>
      </View>
    </Card>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      disabled={isAnyDragging && !isDragging}
      onPress={() => {
        if (isAnyDragging) return;
        onPress(stub);
      }}
    >
      {content}
    </Pressable>
  );
}

interface DraggableWeekRowProps {
  stub: SessionStubRecord;
  index: number;
  isToday: boolean;
  isCompleted: boolean;
  isDragging: boolean;
  isAnyDragging: boolean;
  dragStartTop: number;
  onPress: (stub: SessionStubRecord) => void;
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
  isAnyDragging,
  dragStartTop,
  onPress,
  onDragBegin,
  onDragMove,
  onDragEnd,
  onLayout,
}: DraggableWeekRowProps) {
  const handleGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(1)
        .onStart(() => {
          runOnJS(onDragBegin)(index, stub.sessionId);
        })
        .onUpdate((event) => {
          runOnJS(onDragMove)(event.translationY);
        })
        .onEnd(() => {
          runOnJS(onDragEnd)();
        })
        .onFinalize(() => {
          runOnJS(onDragEnd)();
        }),
    [index, onDragBegin, onDragEnd, onDragMove, stub.sessionId],
  );

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.weekRow,
        isDragging
          ? [
              styles.weekRowDragSource,
              { top: dragStartTop },
            ]
          : null,
      ]}
    >
      <WeekRowCard
        stub={stub}
        isToday={isToday}
        isCompleted={isCompleted}
        isDragging={isDragging}
        isAnyDragging={isAnyDragging}
        gesture={handleGesture}
        onPress={onPress}
      />
    </View>
  );
}

function FloatingDraggedCard({
  stub,
  isToday,
  isCompleted,
  dragStartTop,
  dragTranslateY,
}: {
  stub: SessionStubRecord;
  isToday: boolean;
  isCompleted: boolean;
  dragStartTop: number;
  dragTranslateY: SharedValue<number>;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dragTranslateY.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.floatingDraggedCard,
        { top: dragStartTop },
        animatedStyle,
      ]}
    >
      <WeekRowCard
        stub={stub}
        isToday={isToday}
        isCompleted={isCompleted}
        isDragging
        isAnyDragging
      />
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
  const dragStartTopRef = useRef(0);
  const dragItemHeightRef = useRef(FALLBACK_ROW_HEIGHT);
  const dragStartIndexRef = useRef(0);
  const dragTargetIndexRef = useRef<number | null>(null);
  const draggingSessionIdRef = useRef<string | null>(null);
  const dragTranslateY = useSharedValue(0);

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

  useEffect(() => {
    draggingSessionIdRef.current = draggingSessionId;
  }, [draggingSessionId]);

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
      const activeSessionId = draggingSessionIdRef.current;
      if (!activeSessionId || currentOrder.length === 0) {
        setDraggingSessionId(null);
        setDragTargetIndex(null);
        dragTargetIndexRef.current = null;
        draggingSessionIdRef.current = null;
        return;
      }

      const draggedStub = currentOrder.find((stub) => stub.sessionId === activeSessionId);
      if (!draggedStub) {
        setDraggingSessionId(null);
        setDragTargetIndex(null);
        dragTargetIndexRef.current = null;
        draggingSessionIdRef.current = null;
        return;
      }

      const remaining = currentOrder.filter((stub) => stub.sessionId !== activeSessionId);
      let insertionIndex = clamp(dragTargetIndexRef.current ?? dragStartIndexRef.current, 0, remaining.length);

      if (insertionIndex === dragStartIndexRef.current) {
        const dragDistance = dragLastDyRef.current;
        const dragHeight = dragItemHeightRef.current;
        if (dragHeight > 0 && Math.abs(dragDistance) >= dragHeight * REORDER_OVERLAP_THRESHOLD) {
          insertionIndex = clamp(dragStartIndexRef.current + (dragDistance > 0 ? 1 : -1), 0, remaining.length);
        }
      }

      const nextOrder = [
        ...remaining.slice(0, insertionIndex),
        draggedStub,
        ...remaining.slice(insertionIndex),
      ];
      const changed = nextOrder.some((stub, index) => stub.sessionId !== currentOrder[index]?.sessionId);

      orderedWeekStubsRef.current = nextOrder;
      setOrderedWeekStubs(nextOrder);
      setDraggingSessionId(null);
      setDragTargetIndex(null);
      dragTargetIndexRef.current = null;
      draggingSessionIdRef.current = null;
      dragLastDyRef.current = 0;

      if (changed) {
        void persistWeekOrder(nextOrder);
      }
    },
    [persistWeekOrder],
  );

  const handleDragBegin = useCallback((index: number, sessionId: string) => {
    dragActiveRef.current = true;
    dragStartIndexRef.current = index;
    dragLastDyRef.current = 0;
    dragTranslateY.value = 0;

    const activeLayout = rowLayoutsRef.current[sessionId];
    const rowHeight = activeLayout?.height ?? dragItemHeightRef.current;
    dragItemHeightRef.current = rowHeight;
    dragStartTopRef.current = activeLayout?.top ?? index * (rowHeight + spacing.md);
    dragStartCenterYRef.current = dragStartTopRef.current + rowHeight / 2;

    setDraggingSessionId(sessionId);
    setDragTargetIndex(index);
    dragTargetIndexRef.current = index;
    draggingSessionIdRef.current = sessionId;
  }, [dragTranslateY]);

  const handleDragMove = useCallback((dy: number) => {
    dragLastDyRef.current = dy;
    dragTranslateY.value = dy;
    const activeSessionId = draggingSessionIdRef.current;
    if (!activeSessionId) return;

    const staticStubs = orderedWeekStubsRef.current.filter((stub) => stub.sessionId !== activeSessionId);
    const draggedCenterY = dragStartCenterYRef.current + dy;
    const draggedHeight = dragItemHeightRef.current;
    const isMovingUp = dy < 0;
    let nextTargetIndex = staticStubs.length;

    for (let index = 0; index < staticStubs.length; index += 1) {
      const layout = rowLayoutsRef.current[staticStubs[index].sessionId];
      if (!layout) continue;

      const thresholdY = isMovingUp
        ? layout.top + layout.height * (1 - REORDER_OVERLAP_THRESHOLD) + draggedHeight / 2
        : layout.top + layout.height * REORDER_OVERLAP_THRESHOLD - draggedHeight / 2;
      if (draggedCenterY < thresholdY) {
        nextTargetIndex = index;
        break;
      }
    }

    if (nextTargetIndex !== dragTargetIndexRef.current) {
      dragTargetIndexRef.current = nextTargetIndex;
      setDragTargetIndex(nextTargetIndex);
    }
  }, [dragTranslateY]);

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
  const placeholderRenderIndex = draggingSessionId !== null && dragTargetIndex !== null
    ? dragTargetIndex > dragStartIndexRef.current ? dragTargetIndex + 1 : dragTargetIndex
    : null;
  const draggingStub = draggingSessionId
    ? orderedWeekStubs.find((stub) => stub.sessionId === draggingSessionId) ?? null
    : null;
  const draggingStubIsToday = draggingStub ? nextStub?.sessionId === draggingStub.sessionId : false;
  const draggingStubIsCompleted = draggingStub?.status === "completed";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        scrollEnabled={draggingSessionId === null}
      >
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

        <Section title={t("plan.section.thisWeek")}>
          <Text variant="caption" style={styles.reorderHint}>
            {t("plan.reorderHint")}
          </Text>
          <View style={styles.weekList}>
            {orderedWeekStubs.map((stub, index) => {
              const isToday = nextStub?.sessionId === stub.sessionId;
              const isCompleted = stub.status === "completed";
              const isDragging = draggingSessionId === stub.sessionId;

              return (
                <Fragment key={stub.sessionId}>
                  {placeholderRenderIndex === index ? (
                    <View
                      style={[
                        styles.dropPlaceholder,
                        { height: dragItemHeightRef.current },
                      ]}
                    />
                  ) : null}
                  <DraggableWeekRow
                    stub={stub}
                    index={index}
                    isToday={isToday}
                    isCompleted={isCompleted}
                    isDragging={isDragging}
                    isAnyDragging={draggingSessionId !== null}
                    dragStartTop={dragStartTopRef.current}
                    onPress={(pressedStub) => {
                      if (pressedStub.status === "completed") {
                        router.push(`/session/${pressedStub.sessionId}`);
                        return;
                      }

                      router.push(`/workout/${pressedStub.sessionId}`);
                    }}
                    onDragBegin={handleDragBegin}
                    onDragMove={handleDragMove}
                    onDragEnd={finishDrag}
                    onLayout={(event) => {
                      if (isDragging) return;

                      rowLayoutsRef.current[stub.sessionId] = {
                        top: event.nativeEvent.layout.y,
                        height: event.nativeEvent.layout.height,
                      };
                      if (event.nativeEvent.layout.height > 0) {
                        dragItemHeightRef.current = event.nativeEvent.layout.height;
                      }
                    }}
                  />
                </Fragment>
              );
            })}
            {placeholderRenderIndex === orderedWeekStubs.length ? (
              <View
                style={[
                  styles.dropPlaceholder,
                  { height: dragItemHeightRef.current },
                ]}
              />
            ) : null}
            {draggingStub ? (
              <FloatingDraggedCard
                stub={draggingStub}
                isToday={draggingStubIsToday}
                isCompleted={draggingStubIsCompleted}
                dragStartTop={dragStartTopRef.current}
                dragTranslateY={dragTranslateY}
              />
            ) : null}
          </View>
        </Section>

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

      {nextStub && (
        <View style={styles.ctaContainer}>
          <Divider />
          <View style={styles.ctaPadding}>
            <Button
              title={t("plan.startTodayWorkout")}
              onPress={() => router.push(`/workout/${nextStub.sessionId}?autostart=1`)}
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
  weekList: {
    position: "relative",
    gap: spacing.md,
  },
  weekRow: {
    zIndex: 0,
  },
  weekRowDragSource: {
    position: "absolute",
    left: 0,
    right: 0,
    opacity: 0,
  },
  floatingDraggedCard: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 6,
    opacity: 0.96,
  },
  dropPlaceholder: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceElevated,
    opacity: 0.55,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  cardLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 0,
  },
  thumbnailFrame: {
    width: 82,
    height: 82,
    overflow: "hidden",
    backgroundColor: colors.surfaceElevated,
    flexShrink: 0,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
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
