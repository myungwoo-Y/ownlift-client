import type { ReactNode } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, View } from "react-native";
import { Text, colors } from "../../design";
import { t } from "../../i18n";
import { styles } from "./styles";
import type { ActiveFilterChip } from "./types";

interface HistoryListHeaderProps {
  children: ReactNode;
  hasItems: boolean;
  activeFilterCount: number;
  activeFilterChips: ActiveFilterChip[];
  onOpenFilters: () => void;
}

export function HistoryListHeader({
  children,
  hasItems,
  activeFilterCount,
  activeFilterChips,
  onOpenFilters,
}: HistoryListHeaderProps) {
  return (
    <View style={styles.listHeader}>
      <View style={styles.chartSection}>
        <View style={styles.chartSectionHeader}>
          <Text style={styles.sectionTitle}>{t("history.allLiftTrendTitle")}</Text>
          <Text style={styles.sectionHelper} variant="caption">
            {t("history.allLiftTrendHelper")}
          </Text>
        </View>

        {children}
      </View>

      {hasItems ? (
        <View style={styles.logSection}>
          <View style={styles.logHeaderRow}>
            <Text style={styles.sectionTitle}>{t("history.completedWorkouts")}</Text>
            <Pressable
              onPress={onOpenFilters}
              style={({ pressed }) => [
                styles.filterTrigger,
                pressed ? styles.filterTriggerPressed : null,
              ]}
            >
              <Ionicons color={colors.text} name="options-outline" size={16} />
              <Text style={styles.filterTriggerText}>{t("history.filter.open")}</Text>
              {activeFilterCount > 0 ? (
                <View style={styles.filterTriggerCount}>
                  <Text style={styles.filterTriggerCountText}>{activeFilterCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>

          {activeFilterChips.length > 0 ? (
            <ScrollView
              contentContainerStyle={styles.activeFilterRow}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {activeFilterChips.map((chip) => (
                <Pressable
                  key={chip.key}
                  onPress={chip.onRemove}
                  style={({ pressed }) => [
                    styles.activeFilterChip,
                    pressed ? styles.activeFilterChipPressed : null,
                  ]}
                >
                  <Text style={styles.activeFilterChipText}>{chip.label}</Text>
                  <Ionicons color={colors.text} name="close" size={14} />
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
