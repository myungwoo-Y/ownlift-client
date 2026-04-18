import type { SessionStubRecord } from "@ownlift/db";
import { Fragment, useMemo } from "react";
import type { LayoutChangeEvent } from "react-native";
import { View } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import Animated, {
  type SharedValue,
  runOnJS,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useLocale } from "../../i18n";
import { styles } from "./styles";
import { WeekRowCard } from "./WeekRowCard";

type PanGesture = ReturnType<typeof Gesture.Pan>;

interface PlanWeekListProps {
  orderedWeekStubs: readonly SessionStubRecord[];
  sessionSummaryBySessionId: Readonly<Record<string, string | null>>;
  todaySessionId?: string | null;
  draggingSessionId: string | null;
  dragTargetIndex: number | null;
  dragStartIndex: number;
  dragStartTop: number;
  dragItemHeight: number;
  dragTranslateY: SharedValue<number>;
  reorderableSessionIds: ReadonlySet<string>;
  getScheduledDayLabel: (index: number) => string | null;
  onPressStub?: (stub: SessionStubRecord) => void;
  onDragBegin: (index: number, sessionId: string) => void;
  onDragMove: (dy: number) => void;
  onDragEnd: () => void;
  onRowLayout: (
    sessionId: string,
    event: LayoutChangeEvent,
    isDragging: boolean,
  ) => void;
}

interface DraggableWeekRowProps {
  stub: SessionStubRecord;
  summaryText?: string | null;
  index: number;
  isToday: boolean;
  isCompleted: boolean;
  isReorderable: boolean;
  isDragging: boolean;
  isAnyDragging: boolean;
  scheduledDayLabel?: string | null;
  dragStartTop: number;
  onPress?: (stub: SessionStubRecord) => void;
  onDragBegin: (index: number, sessionId: string) => void;
  onDragMove: (dy: number) => void;
  onDragEnd: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
}

function DraggableWeekRow({
  stub,
  summaryText,
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
  const handleGesture: PanGesture | undefined = useMemo(() => {
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
  }, [index, isReorderable, onDragBegin, onDragEnd, onDragMove, stub.sessionId]);

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
        summaryText={summaryText}
        gesture={handleGesture}
        showDragHandle={isReorderable}
        onPress={onPress}
      />
    </View>
  );
}

interface FloatingDraggedCardProps {
  stub: SessionStubRecord;
  summaryText?: string | null;
  isToday: boolean;
  isCompleted: boolean;
  dragStartTop: number;
  dragTranslateY: SharedValue<number>;
  scheduledDayLabel?: string | null;
}

function FloatingDraggedCard({
  stub,
  summaryText,
  isToday,
  isCompleted,
  dragStartTop,
  dragTranslateY,
  scheduledDayLabel,
}: FloatingDraggedCardProps) {
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
        summaryText={summaryText}
        showDragHandle
      />
    </Animated.View>
  );
}

export function PlanWeekList({
  orderedWeekStubs,
  sessionSummaryBySessionId,
  todaySessionId,
  draggingSessionId,
  dragTargetIndex,
  dragStartIndex,
  dragStartTop,
  dragItemHeight,
  dragTranslateY,
  reorderableSessionIds,
  getScheduledDayLabel,
  onPressStub,
  onDragBegin,
  onDragMove,
  onDragEnd,
  onRowLayout,
}: PlanWeekListProps) {
  useLocale();

  const placeholderRenderIndex = draggingSessionId !== null && dragTargetIndex !== null
    ? dragTargetIndex > dragStartIndex
      ? dragTargetIndex + 1
      : dragTargetIndex
    : null;
  const draggingStub = draggingSessionId
    ? orderedWeekStubs.find((stub) => stub.sessionId === draggingSessionId) ?? null
    : null;
  const draggingStubIsToday = draggingStub
    ? todaySessionId === draggingStub.sessionId
    : false;
  const draggingStubIsCompleted = draggingStub?.status === "completed";

  return (
    <>
      <View style={styles.weekList}>
        {orderedWeekStubs.map((stub, index) => {
          const isToday = todaySessionId === stub.sessionId;
          const isCompleted = stub.status === "completed";
          const isReorderable = reorderableSessionIds.has(stub.sessionId);
          const isDragging = draggingSessionId === stub.sessionId;
          const scheduledDayLabel = getScheduledDayLabel(index);
          const summaryText = sessionSummaryBySessionId[stub.sessionId] ?? null;

          return (
            <Fragment key={stub.sessionId}>
              {placeholderRenderIndex === index ? (
                <View
                  style={[
                    styles.dropPlaceholder,
                    { height: dragItemHeight },
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
                summaryText={summaryText}
                dragStartTop={dragStartTop}
                onPress={onPressStub}
                onDragBegin={onDragBegin}
                onDragMove={onDragMove}
                onDragEnd={onDragEnd}
                onLayout={(event) => onRowLayout(stub.sessionId, event, isDragging)}
              />
            </Fragment>
          );
        })}
        {placeholderRenderIndex === orderedWeekStubs.length ? (
          <View
            style={[
              styles.dropPlaceholder,
              { height: dragItemHeight },
            ]}
          />
        ) : null}
        {draggingStub ? (
          <FloatingDraggedCard
            stub={draggingStub}
            isToday={draggingStubIsToday}
            isCompleted={draggingStubIsCompleted}
            summaryText={sessionSummaryBySessionId[draggingStub.sessionId] ?? null}
            scheduledDayLabel={getScheduledDayLabel(dragStartIndex)}
            dragStartTop={dragStartTop}
            dragTranslateY={dragTranslateY}
          />
        ) : null}
      </View>
    </>
  );
}
