import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { ScrollView, View } from "react-native";
import { Card, Section, Text } from "../../../src/design";
import { getWeekdayShortLabel, t, useLocale } from "../../../src/i18n";
import {
  TAB_BAR_SCROLL_INDICATOR_INSETS,
} from "../../../src/program/plan-screen/constants";
import { PlanWeekList } from "../../../src/program/plan-screen/PlanWeekList";
import { styles } from "../../../src/program/plan-screen/styles";
import { useWeekPrescriptionSummaries } from "../../../src/program/plan-screen/useWeekPrescriptionSummaries";
import { useWeekReorderController } from "../../../src/program/plan-screen/useWeekReorderController";
import { getScheduledDayForIndex } from "../../../src/program/schedule-policy";
import { useProgramStore } from "../../../src/stores/program-store";

export default function PlanReorderScreen() {
  useLocale();

  const {
    instance,
    currentWeekStubs,
    todayStub,
    isLoading,
    loadProgram,
    reorderCurrentWeek,
  } = useProgramStore();

  useFocusEffect(
    useCallback(() => {
      void loadProgram();
    }, [loadProgram]),
  );

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

  const {
    orderedWeekStubs,
    draggingSessionId,
    dragTargetIndex,
    dragStartIndex,
    dragStartTop,
    dragItemHeight,
    dragTranslateY,
    reorderableSessionIds,
    onDragBegin,
    onDragMove,
    onDragEnd,
    onRowLayout,
  } = useWeekReorderController({
    currentWeekStubs,
    persistWeekOrder,
  });

  const unit = instance?.params.unit ?? "";
  const weekSummaryBySessionId = useWeekPrescriptionSummaries({
    instance,
    weekStubs: currentWeekStubs,
    unit,
  });

  if (isLoading || !instance) {
    return (
      <View style={styles.safe}>
        <View style={styles.center}>
          <Text variant="body">{t("plan.loadingProgram")}</Text>
        </View>
      </View>
    );
  }

  const getScheduledDayLabel = (index: number): string | null => {
    if (instance.params.scheduleMode !== "scheduled") {
      return null;
    }

    const scheduledDay = getScheduledDayForIndex(index, instance.params.scheduledDays);
    return scheduledDay ? getWeekdayShortLabel(scheduledDay) : null;
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.container}
      scrollEnabled={draggingSessionId === null}
      scrollIndicatorInsets={TAB_BAR_SCROLL_INDICATOR_INSETS}
      showsVerticalScrollIndicator={false}
      style={styles.safe}
    >
      <Card style={styles.reorderIntroCard}>
        <Text variant="body">{t("plan.reorderScreen.helper")}</Text>
        <Text style={styles.reorderIntroText} variant="caption">
          {t("plan.reorderHint")}
        </Text>
      </Card>

      <Section title={t("plan.section.thisWeek")} titleStyle={styles.sectionTitle}>
        <PlanWeekList
          orderedWeekStubs={orderedWeekStubs}
          sessionSummaryBySessionId={weekSummaryBySessionId}
          todaySessionId={todayStub?.sessionId}
          draggingSessionId={draggingSessionId}
          dragTargetIndex={dragTargetIndex}
          dragStartIndex={dragStartIndex}
          dragStartTop={dragStartTop}
          dragItemHeight={dragItemHeight}
          dragTranslateY={dragTranslateY}
          reorderableSessionIds={reorderableSessionIds}
          getScheduledDayLabel={getScheduledDayLabel}
          onDragBegin={onDragBegin}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          onRowLayout={onRowLayout}
        />
      </Section>
    </ScrollView>
  );
}
