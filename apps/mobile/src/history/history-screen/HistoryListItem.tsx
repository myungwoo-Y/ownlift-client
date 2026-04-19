import { memo } from "react";
import { Pressable, View } from "react-native";
import { Badge, Card, Text } from "../../design";
import { formatNumber, getLiftLabel, getSessionLabel, getWeekLabel, t } from "../../i18n";
import { getLiftSurfaceStyle, styles } from "./styles";
import type { HistoryItem } from "./types";
import {
  WORD_BREAK_TEXT_PROPS,
  formatHistoryDate,
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
  const { day, weekday } = formatHistoryDate(getHistoryItemDate(item));
  const weekLabel = getWeekLabel(item.weekIndex);
  const sessionLabel = getSessionLabel(item.dayIndex);
  const isInteractive = !item.isMock;
  const dateLabel = [day, weekday].filter(Boolean).join(" · ");

  return (
    <Pressable
      disabled={!isInteractive}
      onPress={() => {
        if (!isInteractive) return;
        onPressSession(item.sessionId);
      }}
      style={({ pressed }) => [
        pressed && isInteractive ? styles.cardPressablePressed : null,
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
              <View style={styles.badges}>
                <Badge label={t("status.completed")} variant="completed" />
              </View>
            </View>
            <Text style={styles.historySessionMeta} variant="caption">
              {sessionLabel} · {t("week.title", { week: item.weekIndex + 1 })} · {weekLabel}
            </Text>
            {item.totalVolume != null || item.estimatedOneRepMax != null ? (
              <View style={styles.historyMetricRow}>
                {item.estimatedOneRepMax != null ? (
                  <View style={[styles.historyMetricChip, styles.historyMetricChipPrimary]}>
                    <Text style={styles.historyMetricText}>
                      {`e1RM ${formatMeasurement(item.estimatedOneRepMax, unitLabel)}`}
                    </Text>
                  </View>
                ) : null}
                {item.totalVolume != null ? (
                  <View style={styles.historyMetricChip}>
                    <Text style={styles.historyMetricText}>
                      {t("history.volume", {
                        volume: formatNumber(item.totalVolume),
                        unit: unitLabel,
                      })}
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
