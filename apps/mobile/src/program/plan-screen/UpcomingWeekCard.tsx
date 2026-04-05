import type { SessionStubRecord } from "@ownlift/db";
import { Pressable, View } from "react-native";
import { Card, Text } from "../../design";
import { getLiftLabel, t, useLocale } from "../../i18n";
import { styles } from "./styles";

interface PlanUpcomingWeekCardProps {
  stub: SessionStubRecord;
  onPress: () => void;
}

export function PlanUpcomingWeekCard({
  stub,
  onPress,
}: PlanUpcomingWeekCardProps) {
  useLocale();

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Card>
        <View style={styles.upcomingRow}>
          <View style={styles.upcomingHeader}>
            <Text style={styles.upcomingTitle}>
              {t("week.title", { week: stub.weekIndex + 1 })}
            </Text>
            <Text variant="caption">
              {t("plan.andMore", {
                lift: getLiftLabel(stub.mainLiftKey),
              })}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
      </Card>
    </Pressable>
  );
}
