import { Pressable, View } from "react-native";
import { Card, Text } from "../../design";
import { t, useLocale } from "../../i18n";
import { styles } from "./styles";

interface PlanUpcomingWeekCardProps {
  onPress: () => void;
}

export function PlanUpcomingWeekCard({ onPress }: PlanUpcomingWeekCardProps) {
  useLocale();

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Card>
        <View style={styles.upcomingRow}>
          <Text style={styles.upcomingTitle}>{t("plan.upcoming.viewRemainingWeeks")}</Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      </Card>
    </Pressable>
  );
}
