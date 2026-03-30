import type { SessionStubRecord } from "@ownlift/db";
import type { PrescriptionData } from "@ownlift/schemas";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { type SharedValue, runOnJS, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge, borderRadius, Button, Card, colors, Section, spacing, Text } from "../../src/design";
import { getLiftLabel, getSessionLabel, getWeekdayShortLabel, t, useLocale } from "../../src/i18n";
import { loadSyncedPrescriptionForSession } from "../../src/program/prescription-sync";
import { getScheduledDayForIndex } from "../../src/program/schedule-policy";
import { useProgramStore } from "../../src/stores/program-store";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

const REORDER_OVERLAP_THRESHOLD = 0.4;
const FALLBACK_ROW_HEIGHT = 128;
const TAB_BAR_CLEARANCE = spacing["5xl"] + spacing.lg;
const TAB_BAR_SCROLL_INDICATOR_INSETS = { bottom: TAB_BAR_CLEARANCE };
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

function getReorderableSegmentStart(
  stubs: readonly SessionStubRecord[],
): number {
  let lastLockedIndex = -1;

  for (let index = 0; index < stubs.length; index += 1) {
    const stub = stubs[index];
    if (stub.status === "completed") {
      lastLockedIndex = index;
    }
  }

  return lastLockedIndex + 1;
}

type PanGesture = ReturnType<typeof Gesture.Pan>;

interface WeekRowCardProps {
  stub: SessionStubRecord;
  isToday: boolean;
  isCompleted: boolean;
  isDragging: boolean;
  isAnyDragging: boolean;
  scheduledDayLabel?: string | null;
  gesture?: PanGesture;
  showDragHandle?: boolean;
  onPress?: (stub: SessionStubRecord) => void;
}

function WeekRowCard({
  stub,
  isToday,
  isCompleted,
  isDragging,
  isAnyDragging,
  scheduledDayLabel,
  gesture,
  showDragHandle = true,
  onPress,
}: WeekRowCardProps) {
  const thumbnailSource = getLiftThumbnailSource(stub.mainLiftKey);
  const sessionMeta = t("session.weekAndSession", {
    week: stub.weekIndex + 1,
    session: getSessionLabel(stub.dayIndex),
  });

  const content = (
    <Card highlighted={isToday}>
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
            <View style={styles.metaRow}>
              <Text variant="caption">{sessionMeta}</Text>
              {scheduledDayLabel ? (
                <Badge variant="planned" label={scheduledDayLabel} />
              ) : null}
            </View>
          </View>
        </View>
        <View style={styles.cardRight}>
          {showDragHandle ? (
            gesture ? (
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
            )
          ) : null}
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

function TodayPreviewCard({
  stub,
  prescription,
  scheduledDayLabel,
  unit,
  onStart,
}: {
  stub: SessionStubRecord;
  prescription: PrescriptionData;
  scheduledDayLabel?: string | null;
  unit: string;
  onStart: () => void;
}) {
  const thumbnailSource = getLiftThumbnailSource(stub.mainLiftKey);
  const warmupCount = prescription.sets.filter((setData) => setData.isWarmup).length;
  const workSets = prescription.sets.filter((setData) => !setData.isWarmup);
  const hasAmrap = workSets.some((setData) => setData.isAmrap);

  return (
    <Card highlighted style={styles.todayPreviewCard}>
      <View style={styles.todayPreviewHeader}>
        <View style={styles.todayPreviewCopy}>
          <Text variant="label">{t("plan.section.today")}</Text>
          <Text style={styles.todayPreviewTitle}>{getLiftLabel(stub.mainLiftKey)}</Text>
          <Text variant="caption">
            {t("session.weekAndSession", {
              week: stub.weekIndex + 1,
              session: getSessionLabel(stub.dayIndex),
            })}
          </Text>
        </View>
        {thumbnailSource ? (
          <View style={styles.todayPreviewImageFrame}>
            <Image source={thumbnailSource} contentFit="contain" style={styles.todayPreviewImage} />
          </View>
        ) : null}
      </View>

      <View style={styles.todayPreviewMeta}>
        {scheduledDayLabel ? <Badge variant="planned" label={scheduledDayLabel} /> : null}
        {hasAmrap ? <Badge variant="amrap" label={t("badge.amrap")} /> : null}
        <Badge variant="planned" label={t("plan.preview.totalSets", { count: prescription.sets.length })} />
        {warmupCount > 0 ? (
          <Badge variant="planned" label={t("plan.preview.warmupSets", { count: warmupCount })} />
        ) : null}
      </View>

      <View style={styles.todayPreviewSets}>
        <Text style={styles.todayPreviewSetsLabel}>{t("plan.preview.workSets")}</Text>
        <View style={styles.workSetList}>
          {workSets.map((setData) => (
            <View key={setData.setOrder} style={styles.workSetChip}>
              <Text style={styles.workSetChipWeight}>
                {String(setData.targetWeight)}
                {unit}
              </Text>
              <Text variant="caption">
                × {String(setData.targetReps)}
                {setData.isAmrap ? "+" : ""}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Button title={t("plan.startTodayWorkout")} onPress={onStart} />
    </Card>
  );
}

interface DraggableWeekRowProps {
  stub: SessionStubRecord;
  index: number;
  isToday: boolean;
  isCompleted: boolean;
  isReorderable: boolean;
  isDragging: boolean;
  isAnyDragging: boolean;
  scheduledDayLabel?: string | null;
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
  isReorderable,
  isDragging,
  isAnyDragging,
  scheduledDayLabel,
  dragStartTop,
  onPress,
  onDragBegin,
  onDragMove,
  onDragEnd,
  onLayout,
}: DraggableWeekRowProps) {
  const handleGesture = useMemo(
    () => {
      if (!isReorderable) {
        return undefined;
      }

      return Gesture.Pan()
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
        });
    },
    [index, isReorderable, onDragBegin, onDragEnd, onDragMove, stub.sessionId],
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
        scheduledDayLabel={scheduledDayLabel}
        gesture={handleGesture}
        showDragHandle={isReorderable}
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
  scheduledDayLabel,
}: {
  stub: SessionStubRecord;
  isToday: boolean;
  isCompleted: boolean;
  dragStartTop: number;
  dragTranslateY: SharedValue<number>;
  scheduledDayLabel?: string | null;
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
        scheduledDayLabel={scheduledDayLabel}
        showDragHandle
      />
    </Animated.View>
  );
}

export default function PlanScreen() {
  useLocale();

  const router = useRouter();
  const { instance, currentWeekStubs, stubs, todayStub, isLoading, loadProgram, reorderCurrentWeek } =
    useProgramStore();
  const [orderedWeekStubs, setOrderedWeekStubs] = useState(currentWeekStubs);
  const [draggingSessionId, setDraggingSessionId] = useState<string | null>(null);
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null);
  const [todayPreview, setTodayPreview] = useState<PrescriptionData | null>(null);
  const [isTodayPreviewLoading, setIsTodayPreviewLoading] = useState(true);
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

  useEffect(() => {
    let cancelled = false;

    async function loadTodayPreview() {
      if (!instance || !todayStub) {
        setTodayPreview(null);
        setIsTodayPreviewLoading(false);
        return;
      }

      try {
        setIsTodayPreviewLoading(true);
        const stub = stubs.find((item) => item.sessionId === todayStub.sessionId);
        const rx = await loadSyncedPrescriptionForSession({
          sessionId: todayStub.sessionId,
          instance,
          stub,
        });
        if (cancelled) return;
        setTodayPreview(rx?.data ?? null);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load today preview", error);
          setTodayPreview(null);
        }
      } finally {
        if (!cancelled) {
          setIsTodayPreviewLoading(false);
        }
      }
    }

    void loadTodayPreview();

    return () => {
      cancelled = true;
    };
  }, [instance, stubs, todayStub]);

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
      const reorderableSegmentStart = getReorderableSegmentStart(currentOrder);
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
      let insertionIndex = clamp(
        dragTargetIndexRef.current ?? dragStartIndexRef.current,
        reorderableSegmentStart,
        remaining.length,
      );

      if (insertionIndex === dragStartIndexRef.current) {
        const dragDistance = dragLastDyRef.current;
        const dragHeight = dragItemHeightRef.current;
        if (dragHeight > 0 && Math.abs(dragDistance) >= dragHeight * REORDER_OVERLAP_THRESHOLD) {
          insertionIndex = clamp(
            dragStartIndexRef.current + (dragDistance > 0 ? 1 : -1),
            reorderableSegmentStart,
            remaining.length,
          );
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
    const currentOrder = orderedWeekStubsRef.current;
    const reorderableSegmentStart = getReorderableSegmentStart(currentOrder);
    if (index < reorderableSegmentStart) {
      return;
    }

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

    const reorderableSegmentStart = getReorderableSegmentStart(orderedWeekStubsRef.current);
    const staticStubs = orderedWeekStubsRef.current
      .slice(reorderableSegmentStart)
      .filter((stub) => stub.sessionId !== activeSessionId);
    const draggedCenterY = dragStartCenterYRef.current + dy;
    const draggedHeight = dragItemHeightRef.current;
    const isMovingUp = dy < 0;
    let nextTargetIndex = reorderableSegmentStart + staticStubs.length;

    for (let index = 0; index < staticStubs.length; index += 1) {
      const layout = rowLayoutsRef.current[staticStubs[index].sessionId];
      if (!layout) continue;

      const thresholdY = isMovingUp
        ? layout.top + layout.height * (1 - REORDER_OVERLAP_THRESHOLD) + draggedHeight / 2
        : layout.top + layout.height * REORDER_OVERLAP_THRESHOLD - draggedHeight / 2;
      if (draggedCenterY < thresholdY) {
        nextTargetIndex = reorderableSegmentStart + index;
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
      <SafeAreaView
        collapsable={false}
        edges={["top", "left", "right"]}
        style={styles.safe}
      >
        <View style={styles.center}>
          <Text variant="body">{t("plan.loadingProgram")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { state } = instance;
  const getScheduledDayLabel = (index: number): string | null => {
    if (instance.params.scheduleMode !== "scheduled") {
      return null;
    }

    const scheduledDay = getScheduledDayForIndex(index, instance.params.scheduledDays);
    return scheduledDay ? getWeekdayShortLabel(scheduledDay) : null;
  };
  const completedCount = stubs.filter((s) => s.status === "completed").length;
  const totalCount = stubs.length;
  const reorderableSegmentStart = getReorderableSegmentStart(orderedWeekStubs);
  const reorderableSessionIds = new Set(
    orderedWeekStubs.slice(reorderableSegmentStart).map((stub) => stub.sessionId),
  );
  const placeholderRenderIndex = draggingSessionId !== null && dragTargetIndex !== null
    ? dragTargetIndex > dragStartIndexRef.current ? dragTargetIndex + 1 : dragTargetIndex
    : null;
  const draggingStub = draggingSessionId
    ? orderedWeekStubs.find((stub) => stub.sessionId === draggingSessionId) ?? null
    : null;
  const draggingStubIsToday = draggingStub ? todayStub?.sessionId === draggingStub.sessionId : false;
  const draggingStubIsCompleted = draggingStub?.status === "completed";
  const todayPreviewScheduledDayLabel = todayStub
    ? getScheduledDayLabel(orderedWeekStubs.findIndex((stub) => stub.sessionId === todayStub.sessionId))
    : null;
  const headerSubtitle = todayStub ? getLiftLabel(todayStub.mainLiftKey) : t("plan.section.thisWeek");
  const upcomingStubs = stubs.filter(
    (stub) => stub.cycleIndex === state.currentCycle && stub.weekIndex > state.currentWeek,
  );
  const nextUpcomingStub = upcomingStubs[0] ?? null;

  return (
    <SafeAreaView
      collapsable={false}
      edges={["top", "left", "right"]}
      style={styles.safe}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        contentInsetAdjustmentBehavior="automatic"
        scrollEnabled={draggingSessionId === null}
        scrollIndicatorInsets={TAB_BAR_SCROLL_INDICATOR_INSETS}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>{t("tab.plan")}</Text>
            <Text style={styles.headerTitle}>{t("week.title", { week: state.currentWeek + 1 })}</Text>
          </View>
          <View style={styles.progressRing}>
            <View style={styles.progressRingInner}>
              <Text style={styles.progressValue}>{String(completedCount)}</Text>
              <Text style={styles.progressLabel}>/ {String(totalCount)}</Text>
            </View>
          </View>
        </View>

        <Section title={t("plan.section.today")}>
          {todayStub && todayPreview ? (
            <TodayPreviewCard
              stub={todayStub}
              prescription={todayPreview}
              scheduledDayLabel={todayPreviewScheduledDayLabel}
              unit={instance.params.unit}
              onStart={() => router.push(`/workout/${todayStub.sessionId}?autostart=1`)}
            />
          ) : (
            <Card>
              <View style={styles.todayEmptyState}>
                <Text style={styles.todayEmptyTitle}>
                  {isTodayPreviewLoading ? t("plan.loadingProgram") : t("plan.preview.emptyTitle")}
                </Text>
                {!isTodayPreviewLoading ? (
                  <Text variant="caption">{t("plan.preview.emptySubtitle")}</Text>
                ) : null}
              </View>
            </Card>
          )}
        </Section>

        <Section title={t("plan.section.thisWeek")}>
          <Text variant="caption" style={styles.reorderHint}>
            {t("plan.reorderHint")}
          </Text>
          <View style={styles.weekList}>
            {orderedWeekStubs.map((stub, index) => {
              const isToday = todayStub?.sessionId === stub.sessionId;
              const isCompleted = stub.status === "completed";
              const isReorderable = reorderableSessionIds.has(stub.sessionId);
              const isDragging = draggingSessionId === stub.sessionId;
              const scheduledDayLabel = getScheduledDayLabel(index);

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
                    isReorderable={isReorderable}
                    isDragging={isDragging}
                    isAnyDragging={draggingSessionId !== null}
                    scheduledDayLabel={scheduledDayLabel}
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
                scheduledDayLabel={getScheduledDayLabel(dragStartIndexRef.current)}
                dragStartTop={dragStartTopRef.current}
                dragTranslateY={dragTranslateY}
              />
            ) : null}
          </View>
        </Section>

        {nextUpcomingStub ? (
          <Section title={t("plan.section.upcoming")}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                router.push("/upcoming");
              }}
            >
              <Card>
                <View style={styles.upcomingRow}>
                  <View style={styles.upcomingHeader}>
                    <Text style={styles.upcomingTitle}>
                      {t("week.title", { week: nextUpcomingStub.weekIndex + 1 })}
                    </Text>
                    <Text variant="caption">
                      {t("plan.andMore", {
                        lift: getLiftLabel(nextUpcomingStub.mainLiftKey),
                      })}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </Card>
            </Pressable>
          </Section>
        ) : null}
      </ScrollView>
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
    paddingBottom: spacing["4xl"] + TAB_BAR_CLEARANCE,
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
    alignItems: "flex-end",
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  headerEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.textTertiary,
  },
  headerTitle: {
    fontSize: 42,
    fontWeight: "800",
    lineHeight: 44,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 18,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  progressRing: {
    width: 88,
    height: 88,
    borderRadius: borderRadius.full,
    borderCurve: "continuous",
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.18)",
    boxShadow: "0px 18px 40px rgba(0, 0, 0, 0.28)",
  },
  progressRingInner: {
    width: 66,
    height: 66,
    borderRadius: borderRadius.full,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceGlassStrong,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  progressValue: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 24,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  todayPreviewCard: {
    gap: spacing.lg,
  },
  todayPreviewHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
  },
  todayPreviewCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  todayPreviewTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.text,
  },
  todayPreviewImageFrame: {
    width: 112,
    height: 112,
    borderRadius: 28,
    borderCurve: "continuous",
    backgroundColor: colors.primarySoft,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  todayPreviewImage: {
    width: "100%",
    height: "100%",
  },
  todayPreviewMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  todayPreviewSets: {
    gap: spacing.sm,
  },
  todayPreviewSetsLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  workSetList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  workSetChip: {
    minWidth: 88,
    borderRadius: borderRadius.lg,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  workSetChipWeight: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  todayEmptyState: {
    gap: spacing.sm,
  },
  todayEmptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
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
    opacity: 0.96,
    boxShadow: "0px 24px 60px rgba(0, 0, 0, 0.32)",
  },
  dropPlaceholder: {
    borderRadius: borderRadius.xl,
    borderCurve: "continuous",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: colors.surfaceMuted,
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
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
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
    borderRadius: 22,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: colors.surfaceMuted,
    flexShrink: 0,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  dragHandle: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: borderRadius.lg,
    borderCurve: "continuous",
    backgroundColor: colors.surfaceGlass,
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
    borderColor: "rgba(255, 255, 255, 0.14)",
    backgroundColor: colors.surfaceGlassStrong,
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
  upcomingHeader: {
    gap: spacing.xs,
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
});
