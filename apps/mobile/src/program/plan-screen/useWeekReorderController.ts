import type { SessionStubRecord } from "@ownlift/db";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { spacing } from "../../design";
import {
  FALLBACK_ROW_HEIGHT,
  REORDER_OVERLAP_THRESHOLD,
} from "./constants";
import { clamp, getReorderableSegmentStart } from "./utils";

interface UseWeekReorderControllerArgs {
  currentWeekStubs: readonly SessionStubRecord[];
  persistWeekOrder: (nextOrder: SessionStubRecord[]) => Promise<void> | void;
}

export function useWeekReorderController({
  currentWeekStubs,
  persistWeekOrder,
}: UseWeekReorderControllerArgs) {
  const [orderedWeekStubs, setOrderedWeekStubs] = useState<SessionStubRecord[]>([
    ...currentWeekStubs,
  ]);
  const [draggingSessionId, setDraggingSessionId] = useState<string | null>(null);
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null);
  const orderedWeekStubsRef = useRef<SessionStubRecord[]>([...currentWeekStubs]);
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

  useEffect(() => {
    if (draggingSessionId !== null) {
      syncedWeekStubsRef.current = currentWeekStubs;
      return;
    }

    if (syncedWeekStubsRef.current !== currentWeekStubs) {
      const nextStubs = [...currentWeekStubs];
      orderedWeekStubsRef.current = nextStubs;
      setOrderedWeekStubs(nextStubs);
      syncedWeekStubsRef.current = currentWeekStubs;
    }
  }, [currentWeekStubs, draggingSessionId]);

  useEffect(() => {
    orderedWeekStubsRef.current = orderedWeekStubs;
  }, [orderedWeekStubs]);

  useEffect(() => {
    draggingSessionIdRef.current = draggingSessionId;
  }, [draggingSessionId]);

  const finishDrag = useCallback(() => {
    if (!dragActiveRef.current) {
      return;
    }

    dragActiveRef.current = false;

    const currentOrder = orderedWeekStubsRef.current;
    const reorderableSegmentStart = getReorderableSegmentStart(currentOrder);
    const activeSessionId = draggingSessionIdRef.current;
    if (!activeSessionId || currentOrder.length === 0) {
      setDraggingSessionId(null);
      setDragTargetIndex(null);
      dragTargetIndexRef.current = null;
      draggingSessionIdRef.current = null;
      dragLastDyRef.current = 0;
      dragTranslateY.value = 0;
      return;
    }

    const draggedStub = currentOrder.find((stub) => stub.sessionId === activeSessionId);
    if (!draggedStub) {
      setDraggingSessionId(null);
      setDragTargetIndex(null);
      dragTargetIndexRef.current = null;
      draggingSessionIdRef.current = null;
      dragLastDyRef.current = 0;
      dragTranslateY.value = 0;
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
    dragTranslateY.value = 0;

    if (changed) {
      void persistWeekOrder(nextOrder);
    }
  }, [dragTranslateY, persistWeekOrder]);

  const handleDragBegin = useCallback(
    (index: number, sessionId: string) => {
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
    },
    [dragTranslateY],
  );

  const handleDragMove = useCallback(
    (dy: number) => {
      dragLastDyRef.current = dy;
      dragTranslateY.value = dy;
      const activeSessionId = draggingSessionIdRef.current;
      if (!activeSessionId) {
        return;
      }

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
        if (!layout) {
          continue;
        }

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
    },
    [dragTranslateY],
  );

  const handleRowLayout = useCallback(
    (sessionId: string, event: LayoutChangeEvent, isDragging: boolean) => {
      if (isDragging) {
        return;
      }

      rowLayoutsRef.current[sessionId] = {
        top: event.nativeEvent.layout.y,
        height: event.nativeEvent.layout.height,
      };

      if (event.nativeEvent.layout.height > 0) {
        dragItemHeightRef.current = event.nativeEvent.layout.height;
      }
    },
    [],
  );

  const reorderableSessionIds = useMemo(() => {
    const reorderableSegmentStart = getReorderableSegmentStart(orderedWeekStubs);
    return new Set(orderedWeekStubs.slice(reorderableSegmentStart).map((stub) => stub.sessionId));
  }, [orderedWeekStubs]);

  return {
    orderedWeekStubs,
    draggingSessionId,
    dragTargetIndex,
    dragStartIndex: dragStartIndexRef.current,
    dragStartTop: dragStartTopRef.current,
    dragItemHeight: dragItemHeightRef.current,
    dragTranslateY,
    reorderableSessionIds,
    onDragBegin: handleDragBegin,
    onDragMove: handleDragMove,
    onDragEnd: finishDrag,
    onRowLayout: handleRowLayout,
  };
}
