import type { PrescriptionData } from "@ownlift/schemas";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { ScrollView, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Section, Text, spacing } from "../../src/design";
import { getWeekdayShortLabel, t, useLocale } from "../../src/i18n";
import { loadSyncedPrescriptionForSession } from "../../src/program/prescription-sync";
import {
  FALLBACK_ROW_HEIGHT,
  REORDER_OVERLAP_THRESHOLD,
  TAB_BAR_SCROLL_INDICATOR_INSETS,
} from "../../src/program/plan-screen/constants";
import { PlanHeader } from "../../src/program/plan-screen/PlanHeader";
import { PlanTodayPreviewCard } from "../../src/program/plan-screen/TodayPreviewCard";
import { PlanUpcomingWeekCard } from "../../src/program/plan-screen/UpcomingWeekCard";
import { PlanWeekList } from "../../src/program/plan-screen/PlanWeekList";
import { styles } from "../../src/program/plan-screen/styles";
import { clamp, getReorderableSegmentStart } from "../../src/program/plan-screen/utils";
import { getScheduledDayForIndex } from "../../src/program/schedule-policy";
import { useProgramStore } from "../../src/stores/program-store";

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

  const finishDrag = useCallback(() => {
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
  }, [persistWeekOrder]);

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
  const reorderableSegmentStart = getReorderableSegmentStart(orderedWeekStubs);
  const reorderableSessionIds = new Set(
    orderedWeekStubs.slice(reorderableSegmentStart).map((stub) => stub.sessionId),
  );
  const todayPreviewScheduledDayLabel = todayStub
    ? getScheduledDayLabel(orderedWeekStubs.findIndex((stub) => stub.sessionId === todayStub.sessionId))
    : null;
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
        <PlanHeader currentWeek={state.currentWeek} />

        <Section title={t("plan.section.today")}>
          {todayStub && todayPreview ? (
            <PlanTodayPreviewCard
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
          <PlanWeekList
            orderedWeekStubs={orderedWeekStubs}
            todaySessionId={todayStub?.sessionId}
            draggingSessionId={draggingSessionId}
            dragTargetIndex={dragTargetIndex}
            dragStartIndex={dragStartIndexRef.current}
            dragStartTop={dragStartTopRef.current}
            dragItemHeight={dragItemHeightRef.current}
            dragTranslateY={dragTranslateY}
            reorderableSessionIds={reorderableSessionIds}
            getScheduledDayLabel={getScheduledDayLabel}
            onPressStub={(pressedStub) => {
              if (pressedStub.status === "completed") {
                router.push(`/session/${pressedStub.sessionId}`);
                return;
              }

              router.push(`/workout/${pressedStub.sessionId}`);
            }}
            onDragBegin={handleDragBegin}
            onDragMove={handleDragMove}
            onDragEnd={finishDrag}
            onRowLayout={(sessionId, event: LayoutChangeEvent, isDragging: boolean) => {
              if (isDragging) return;

              rowLayoutsRef.current[sessionId] = {
                top: event.nativeEvent.layout.y,
                height: event.nativeEvent.layout.height,
              };
              if (event.nativeEvent.layout.height > 0) {
                dragItemHeightRef.current = event.nativeEvent.layout.height;
              }
            }}
          />
        </Section>

        {nextUpcomingStub ? (
          <Section title={t("plan.section.upcoming")}>
            <PlanUpcomingWeekCard
              stub={nextUpcomingStub}
              onPress={() => {
                router.push("/upcoming");
              }}
            />
          </Section>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
