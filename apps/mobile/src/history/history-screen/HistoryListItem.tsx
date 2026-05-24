import { memo } from "react";
import { Pressable, View } from "react-native";
import { Card, Text } from "../../design";
import { getLiftLabel, t } from "../../i18n";
import { getLiftSurfaceStyle, styles } from "./styles";
import type { HistoryItem } from "./types";
import {
  WORD_BREAK_TEXT_PROPS,
  formatHistoryDateLabel,
  formatLastWorkSetMetric,
  formatMeasurement,
  getHistoryItemDate,
} from "./utils";

interface HistoryListItemProps {
  item: HistoryItem;
  unitLabel: string;
  onPressSession: (sessionId: string) => void;
}

function HistoryListItemComponent({
  item,
  unitLabel,
  onPressSession,
}: HistoryListItemProps) {
  const dateLabel = formatHistoryDateLabel(getHistoryItemDate(item));
  const estimatedOneRepMax = item.estimatedOneRepMax != null
    ? formatMeasurement(item.estimatedOneRepMax, unitLabel)
    : null;
  const lastWorkSet = item.lastWorkSet
    ? formatLastWorkSetMetric(item.lastWorkSet, unitLabel)
    : null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        onPressSession(item.sessionId);
      }}
      style={({ pressed }) => [
        pressed ? styles.cardPressablePressed : null,
      ]}
    >
      <Card style={[styles.historyCard, getLiftSurfaceStyle(item.mainLiftKey)]}>
        <View style={styles.historyItem}>
          <View style={styles.detailColumn}>
            <View style={styles.titleRow}>
              <Text
                {...WORD_BREAK_TEXT_PROPS}
                numberOfLines={1}
                style={styles.historyLiftName}
              >
                {getLiftLabel(item.mainLiftKey)}
              </Text>
              {estimatedOneRepMax ? (
                <View style={[styles.historyMetricChip, styles.historyMetricChipPrimary]}>
                  <Text
                    adjustsFontSizeToFit
                    minimumFontScale={0.86}
                    numberOfLines={1}
                    style={styles.historyMetricText}
                  >
                    {`${t("history.estimatedMaxLabel")} ${estimatedOneRepMax}`}
                  </Text>
                </View>
              ) : null}
            </View>
            {dateLabel ? (
              <Text style={styles.historyDateMeta} variant="caption">
                {dateLabel}
              </Text>
            ) : null}
            <View style={styles.historyWeekRow}>
              <Text style={styles.historySessionMeta} variant="caption">
                {t("week.title", { week: item.weekIndex + 1 })}
              </Text>
              {lastWorkSet ? (
                <>
                  <Text style={styles.historySessionMeta} variant="caption">
                    |
                  </Text>
                  <Text numberOfLines={1} style={styles.historyTopSetText}>
                    {lastWorkSet}
                  </Text>
                </>
              ) : null}
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export const HistoryListItem = memo(HistoryListItemComponent);
HistoryListItem.displayName = "HistoryListItem";
