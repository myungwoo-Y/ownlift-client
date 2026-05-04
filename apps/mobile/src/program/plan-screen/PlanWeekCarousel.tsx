import type { SessionStubRecord } from "@ownlift/db";
import { Image } from "expo-image";
import { Pressable, View } from "react-native";
import { Badge, colors, Text } from "../../design";
import {
  getLiftLabel,
  getSessionLabel,
  t,
  useLocale,
} from "../../i18n";
import { styles } from "./styles";
import { getLiftThumbnailSource } from "./utils";

interface PlanWeekCarouselProps {
  weekStubs: readonly SessionStubRecord[];
  sessionSummaryBySessionId: Readonly<Record<string, string | null>>;
  todaySessionId?: string | null;
  getScheduledDayLabel: (index: number) => string | null;
  onPressStub: (stub: SessionStubRecord) => void;
}

const WEEK_GRID_COLUMNS = 2;

function getPalette(mainLiftKey: SessionStubRecord["mainLiftKey"]) {
  if (mainLiftKey === "bench") {
    return {
      card: styles.weekCarouselCardBench,
      meta: styles.weekCarouselMetaLight,
      title: styles.weekCarouselTitleLight,
      summary: styles.weekCarouselSummaryLight,
    };
  }

  if (mainLiftKey === "deadlift") {
    return {
      card: styles.weekCarouselCardDeadlift,
      meta: styles.weekCarouselMetaLight,
      title: styles.weekCarouselTitleLight,
      summary: styles.weekCarouselSummaryLight,
    };
  }

  if (mainLiftKey === "press") {
    return {
      card: styles.weekCarouselCardPress,
      meta: styles.weekCarouselMetaLight,
      title: styles.weekCarouselTitleLight,
      summary: styles.weekCarouselSummaryLight,
    };
  }

  return {
    card: styles.weekCarouselCardSquat,
    meta: styles.weekCarouselMetaLight,
    title: styles.weekCarouselTitleLight,
    summary: styles.weekCarouselSummaryLight,
  };
}

export function PlanWeekCarousel({
  weekStubs,
  sessionSummaryBySessionId,
  todaySessionId,
  getScheduledDayLabel,
  onPressStub,
}: PlanWeekCarouselProps) {
  useLocale();
  const rows: SessionStubRecord[][] = [];

  for (let index = 0; index < weekStubs.length; index += WEEK_GRID_COLUMNS) {
    rows.push(weekStubs.slice(index, index + WEEK_GRID_COLUMNS));
  }

  return (
    <View style={styles.weekGrid}>
      {rows.map((row, rowIndex) => (
        <View key={`week-grid-row-${rowIndex}`} style={styles.weekGridRow}>
          {row.map((stub, columnIndex) => {
            const index = rowIndex * WEEK_GRID_COLUMNS + columnIndex;
            const isToday = todaySessionId === stub.sessionId;
            const isCompleted = stub.status === "completed";
            const scheduledDayLabel = getScheduledDayLabel(index);
            const sessionLabel = getSessionLabel(stub.dayIndex);
            const metaLabel = scheduledDayLabel ? `${scheduledDayLabel} · ${sessionLabel}` : sessionLabel;
            const summaryText = sessionSummaryBySessionId[stub.sessionId];
            const thumbnailSource = getLiftThumbnailSource(stub.mainLiftKey);
            const palette = getPalette(stub.mainLiftKey);
            const thumbnailTintColor = isToday || isCompleted ? colors.primary : colors.textTertiary;

            return (
              <Pressable
                accessibilityRole="button"
                key={stub.sessionId}
                onPress={() => onPressStub(stub)}
                style={({ pressed }) => [
                  styles.weekCarouselCard,
                  styles.weekGridCard,
                  palette.card,
                  isToday ? styles.weekCarouselCardToday : null,
                  isCompleted ? styles.weekCarouselCardCompleted : null,
                  pressed ? styles.weekCarouselCardPressed : null,
                ]}
              >
                <View style={styles.weekCarouselTopRow}>
                  {thumbnailSource ? (
                    <View
                      style={[
                        styles.weekCarouselThumbnailFrame,
                        styles.weekGridThumbnailFrame,
                      ]}
                    >
                      <Image
                        source={thumbnailSource}
                        contentFit="contain"
                        style={styles.thumbnailImage}
                        tintColor={thumbnailTintColor}
                      />
                    </View>
                  ) : <View />}
                  <Badge
                    size="compact"
                    variant={isCompleted ? "completed" : isToday ? "today" : "planned"}
                    label={
                      isCompleted
                        ? t("status.completed")
                        : isToday
                          ? t("status.today")
                          : t("status.planned")
                    }
                  />
                </View>

                <View style={styles.weekCarouselBody}>
                  <Text numberOfLines={1} style={palette.meta}>
                    {metaLabel}
                  </Text>
                  <Text numberOfLines={2} style={palette.title}>
                    {getLiftLabel(stub.mainLiftKey)}
                  </Text>
                  <Text numberOfLines={2} style={palette.summary}>
                    {summaryText ?? t("session.weekAndSession", {
                      week: stub.weekIndex + 1,
                      session: sessionLabel,
                    })}
                  </Text>
                </View>
              </Pressable>
            );
          })}
          {row.length < WEEK_GRID_COLUMNS ? (
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={styles.weekGridSpacer}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}
