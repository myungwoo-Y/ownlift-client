import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Image } from "expo-image";
import { Pressable, View } from "react-native";
import { Card, Text, colors } from "../../design";
import { formatNumber, getLiftLabel, t, useLocale } from "../../i18n";
import { styles } from "./styles";
import type { PlanActivitySummary } from "./usePlanActivitySummary";
import { getLiftThumbnailSource } from "./utils";

interface PlanActivitySummaryCardsProps {
  summary: PlanActivitySummary;
  onPressSession: (session: PlanActivitySummary["currentCycleSessions"][number]) => void;
}

interface ActivityItemProps {
  iconName: ComponentProps<typeof Ionicons>["name"];
  iconColor: string;
  label: string;
  value: string;
  isLast?: boolean;
}

const CYCLE_GRID_COLUMNS = 4;
const TROPHY_COLOR = "#F8CA48";

function formatProgressValue(completed: number, total: number): string {
  return `${formatNumber(completed)} / ${formatNumber(total)}`;
}

function ActivityItem({
  iconName,
  iconColor,
  label,
  value,
  isLast = false,
}: ActivityItemProps) {
  return (
    <View style={styles.activitySummaryItemContainer}>
      <View style={styles.activitySummaryItem}>
        <View style={styles.activitySummaryMetaRow}>
          <Ionicons color={iconColor} name={iconName} size={18} />
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.82}
            numberOfLines={1}
            style={styles.activitySummaryLabel}
          >
            {label}
          </Text>
        </View>
        <View style={styles.activitySummaryValueRow}>
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            numberOfLines={1}
            style={styles.activitySummaryValue}
          >
            {value}
          </Text>
        </View>
      </View>
      {!isLast && <View style={styles.activitySummaryItemDivider} />}
    </View>
  );
}

interface ActivityCycleGridProps {
  onPressSession: PlanActivitySummaryCardsProps["onPressSession"];
  sessions: PlanActivitySummary["currentCycleSessions"];
}

function ActivityCycleGrid({ onPressSession, sessions }: ActivityCycleGridProps) {
  const rows: PlanActivitySummary["currentCycleSessions"][] = [];

  for (let index = 0; index < sessions.length; index += CYCLE_GRID_COLUMNS) {
    rows.push(sessions.slice(index, index + CYCLE_GRID_COLUMNS));
  }

  if (rows.length === 0) {
    return null;
  }

  return (
    <View style={styles.activityCycleGrid}>
      {rows.map((row, rowIndex) => (
        <View key={`activity-cycle-grid-row-${rowIndex}`} style={styles.activityCycleGridRow}>
          {row.map((session) => {
            const thumbnailSource = getLiftThumbnailSource(session.mainLiftKey);
            const isCompleted = session.status === "completed";

            return (
              <Pressable
                accessibilityLabel={getLiftLabel(session.mainLiftKey)}
                accessibilityRole="button"
                key={session.sessionId}
                onPress={() => {
                  onPressSession(session);
                }}
                style={({ pressed }) => [
                  styles.activityCycleGridCell,
                  isCompleted
                    ? styles.activityCycleGridCellCompleted
                    : styles.activityCycleGridCellPending,
                  pressed ? styles.activityCycleGridCellPressed : null,
                ]}
              >
                {thumbnailSource ? (
                  <Image
                    accessible={false}
                    contentFit="contain"
                    source={thumbnailSource}
                    style={styles.activityCycleGridIcon}
                    tintColor={isCompleted ? colors.primaryForeground : colors.textTertiary}
                  />
                ) : null}
              </Pressable>
            );
          })}
          {Array.from({ length: CYCLE_GRID_COLUMNS - row.length }).map((_, spacerIndex) => (
            <View
              accessibilityElementsHidden
              key={`activity-cycle-grid-spacer-${spacerIndex}`}
              importantForAccessibility="no-hide-descendants"
              style={styles.activityCycleGridSpacer}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export function PlanActivitySummaryCards({
  onPressSession,
  summary,
}: PlanActivitySummaryCardsProps) {
  useLocale();

  return (
    <Card style={styles.activitySummaryCard}>
      <View style={styles.activitySummarySurface}>
        <ActivityItem
          iconName="barbell"
          iconColor={colors.primary}
          isLast={false}
          label={t("plan.activity.week")}
          value={formatProgressValue(summary.currentWeekCompleted, summary.currentWeekTotal)}
        />
        <ActivityItem
          iconName="refresh"
          iconColor={colors.primary}
          isLast={false}
          label={t("plan.activity.cycle")}
          value={formatProgressValue(summary.currentCycleCompleted, summary.currentCycleTotal)}
        />
        <ActivityItem
          iconName="trophy"
          iconColor={TROPHY_COLOR}
          isLast
          label={t("plan.activity.last7Days")}
          value={t("plan.activity.workoutCount", {
            count: formatNumber(summary.recentWorkoutCount),
          })}
        />
      </View>
      <ActivityCycleGrid
        onPressSession={onPressSession}
        sessions={summary.currentCycleSessions}
      />
    </Card>
  );
}
