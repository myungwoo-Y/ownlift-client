import { View } from "react-native";
import { Text } from "../../design";
import { t, useLocale } from "../../i18n";
import { styles } from "./styles";

interface PlanHeaderProps {
  currentWeek: number;
}

export function PlanHeader({ currentWeek }: PlanHeaderProps) {
  useLocale();

  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        <Text style={styles.headerEyebrow}>{t("tab.plan")}</Text>
        <Text style={styles.headerTitle}>
          {t("week.title", { week: currentWeek + 1 })}
        </Text>
      </View>
    </View>
  );
}
