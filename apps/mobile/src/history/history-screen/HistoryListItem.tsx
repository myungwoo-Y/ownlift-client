import { memo } from "react";
import { Pressable, View } from "react-native";
import { Card, Text } from "../../design";
import { getLiftLabel, getSessionLabel, getWeekLabel, t } from "../../i18n";
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
  const weekLabel = getWeekLabel(item.weekIndex);
  const sessionLabel = getSessionLabel(item.dayIndex);
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
              <View style={styles.titleCopy}>
                <Text
                  {...WORD_BREAK_TEXT_PROPS}
                  style={styles.historyLiftName}
                >
                  {getLiftLabel(item.mainLiftKey)}
                </Text>
                {dateLabel ? (
                  <Text style={styles.historyDateMeta} variant="caption">
                    {dateLabel}
                  </Text>
                ) : null}
              </View>
            </View>
            <Text style={styles.historySessionMeta} variant="caption">
              {sessionLabel} / {t("week.title", { week: item.weekIndex + 1 })} / {weekLabel}
            </Text>
            {lastWorkSet || item.estimatedOneRepMax != null ? (
              <View style={styles.historyMetricRow}>
                {item.estimatedOneRepMax != null ? (
                  <View style={[styles.historyMetricChip, styles.historyMetricChipPrimary]}>
                    <Text style={styles.historyMetricText}>
                      {`e1RM ${formatMeasurement(item.estimatedOneRepMax, unitLabel)}`}
                    </Text>
                  </View>
                ) : null}
                {lastWorkSet ? (
                  <View style={styles.historyMetricChip}>
                    <Text style={styles.historyMetricText}>
                      {lastWorkSet}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export const HistoryListItem = memo(HistoryListItemComponent);
HistoryListItem.displayName = "HistoryListItem";
