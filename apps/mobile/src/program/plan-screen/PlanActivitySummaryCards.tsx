import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { View } from "react-native";
import { Card, Text, colors } from "../../design";
import { formatNumber, t, useLocale } from "../../i18n";
import { styles } from "./styles";
import type { PlanActivitySummary } from "./usePlanActivitySummary";

interface PlanActivitySummaryCardsProps {
  summary: PlanActivitySummary;
}

interface ActivityItemProps {
  iconName: ComponentProps<typeof Ionicons>["name"];
  iconColor: string;
  label: string;
  value: string;
  isLast?: boolean;
}

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

export function PlanActivitySummaryCards({
  summary,
}: PlanActivitySummaryCardsProps) {
  useLocale();

  return (
    <Card style={styles.activitySummaryCard}>
      <View style={styles.activitySummarySurface}>
        <ActivityItem
          iconName="barbell"
          iconColor="#8FB9FF"
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
          iconColor="#F8CA48"
          isLast
          label={t("plan.activity.last7Days")}
          value={t("plan.activity.workoutCount", {
            count: formatNumber(summary.recentWorkoutCount),
          })}
        />
      </View>
    </Card>
  );
}
