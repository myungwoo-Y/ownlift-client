import type { SessionStubRecord } from "@ownlift/db";
import { useMemo } from "react";
import { Image } from "expo-image";
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { Badge, colors, spacing, Text } from "../../design";
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

function getPalette(mainLiftKey: SessionStubRecord["mainLiftKey"]) {
  if (mainLiftKey === "bench") {
    return {
      card: styles.weekCarouselCardBench,
      thumbnail: styles.weekCarouselThumbnailBench,
      meta: styles.weekCarouselMetaLight,
      title: styles.weekCarouselTitleLight,
      summary: styles.weekCarouselSummaryLight,
      tintColor: colors.primary,
    };
  }

  if (mainLiftKey === "deadlift") {
    return {
      card: styles.weekCarouselCardDeadlift,
      thumbnail: styles.weekCarouselThumbnailDeadlift,
      meta: styles.weekCarouselMetaLight,
      title: styles.weekCarouselTitleLight,
      summary: styles.weekCarouselSummaryLight,
      tintColor: colors.primary,
    };
  }

  if (mainLiftKey === "press") {
    return {
      card: styles.weekCarouselCardPress,
      thumbnail: styles.weekCarouselThumbnailPress,
      meta: styles.weekCarouselMetaLight,
      title: styles.weekCarouselTitleLight,
      summary: styles.weekCarouselSummaryLight,
      tintColor: colors.primary,
    };
  }

  return {
    card: styles.weekCarouselCardSquat,
    thumbnail: styles.weekCarouselThumbnailSquat,
    meta: styles.weekCarouselMetaLight,
    title: styles.weekCarouselTitleLight,
    summary: styles.weekCarouselSummaryLight,
    tintColor: colors.primary,
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
  const { width: viewportWidth } = useWindowDimensions();
  const cardWidth = useMemo(
    () =>
      Math.round(
        Math.min(
          160,
          Math.max(120, (viewportWidth - spacing["2xl"] - spacing.md * 2) / 2.25),
        ),
      ),
    [viewportWidth],
  );
  const snapToInterval = cardWidth + spacing.md;
  const cardWidthStyle = useMemo(() => ({ width: cardWidth }), [cardWidth]);

  return (
    <ScrollView
      decelerationRate="fast"
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToAlignment="start"
      snapToInterval={snapToInterval}
      style={styles.weekCarouselViewport}
      contentContainerStyle={styles.weekCarouselContent}
    >
      {weekStubs.map((stub, index) => {
        const isToday = todaySessionId === stub.sessionId;
        const isCompleted = stub.status === "completed";
        const scheduledDayLabel = getScheduledDayLabel(index);
        const sessionLabel = getSessionLabel(stub.dayIndex);
        const metaLabel = scheduledDayLabel ? `${scheduledDayLabel} · ${sessionLabel}` : sessionLabel;
        const summaryText = sessionSummaryBySessionId[stub.sessionId];
        const thumbnailSource = getLiftThumbnailSource(stub.mainLiftKey);
        const palette = getPalette(stub.mainLiftKey);

        return (
          <Pressable
            key={stub.sessionId}
            onPress={() => onPressStub(stub)}
            style={({ pressed }) => [
              styles.weekCarouselCard,
              cardWidthStyle,
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
                    palette.thumbnail,
                    isToday ? styles.weekCarouselThumbnailToday : null,
                  ]}
                >
                  <Image
                    source={thumbnailSource}
                    contentFit="contain"
                    style={styles.thumbnailImage}
                    tintColor={palette.tintColor}
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
    </ScrollView>
  );
}
