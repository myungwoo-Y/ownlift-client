import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Card,
  Section,
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  spacing,
  Text,
} from "../../../src/design";
import { useHistoryFilterStore, type HistoryFilterOption, type HistoryListLiftFilter } from "../../../src/history/history-filter-store";
import { t, useLocale } from "../../../src/i18n";

function FilterOptionSection({
  title,
  options,
  selectedKey,
  onSelect,
}: {
  title: string;
  options: HistoryFilterOption[];
  selectedKey: string;
  onSelect: (key: string) => void;
}) {
  return (
    <Section title={title}>
      <Card style={styles.card}>
        <View style={styles.optionGrid}>
          {options.map((option) => {
            const isSelected = option.key === selectedKey;

            return (
              <Pressable
                key={option.key}
                style={[styles.optionChip, isSelected && styles.optionChipSelected]}
                onPress={() => onSelect(option.key)}
              >
                <Text style={[styles.optionChipText, isSelected && styles.optionChipTextSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>
    </Section>
  );
}

export default function HistoryFilterScreen() {
  useLocale();

  const router = useRouter();
  const monthOptions = useHistoryFilterStore((state) => state.monthOptions);
  const liftOptions = useHistoryFilterStore((state) => state.liftOptions);
  const selectedMonthKey = useHistoryFilterStore((state) => state.selectedMonthKey);
  const selectedListLift = useHistoryFilterStore((state) => state.selectedListLift);
  const setSelectedMonthKey = useHistoryFilterStore((state) => state.setSelectedMonthKey);
  const setSelectedListLift = useHistoryFilterStore((state) => state.setSelectedListLift);

  const resolvedMonthOptions = monthOptions.length > 0
    ? monthOptions
    : [{ key: "all", label: t("history.filter.all") }];
  const resolvedLiftOptions = liftOptions.length > 0
    ? liftOptions
    : [{ key: "all", label: t("history.filter.all") }];
  const initialMonthKey = resolvedMonthOptions.some((option) => option.key === selectedMonthKey)
    ? selectedMonthKey
    : "all";
  const initialListLift = resolvedLiftOptions.some((option) => option.key === selectedListLift)
    ? selectedListLift
    : "all";

  const [draftMonthKey, setDraftMonthKey] = useState(initialMonthKey);
  const [draftListLift, setDraftListLift] = useState<HistoryListLiftFilter>(initialListLift);

  function handleReset(): void {
    setDraftMonthKey("all");
    setDraftListLift("all");
  }

  function handleApply(): void {
    setSelectedMonthKey(draftMonthKey);
    setSelectedListLift(draftListLift);
    router.back();
  }

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safe}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View style={styles.header}>
          <Text variant="body">{t("history.filter.helper")}</Text>
        </View>

        <FilterOptionSection
          title={t("history.filter.period")}
          options={resolvedMonthOptions}
          selectedKey={draftMonthKey}
          onSelect={setDraftMonthKey}
        />

        <FilterOptionSection
          title={t("history.filter.exercise")}
          options={resolvedLiftOptions}
          selectedKey={draftListLift}
          onSelect={(key) => setDraftListLift(key as HistoryListLiftFilter)}
        />
      </ScrollView>

      <View style={styles.actions}>
        <Button
          title={t("history.filter.reset")}
          variant="ghost"
          size="md"
          onPress={handleReset}
          style={styles.actionButton}
        />
        <Button
          title={t("history.filter.apply")}
          size="md"
          onPress={handleApply}
          style={styles.actionButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing["2xl"],
    paddingBottom: spacing["2xl"],
    gap: spacing["2xl"],
  },
  header: {
    gap: spacing.sm,
  },
  card: {
    gap: spacing.md,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  optionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: colors.surfaceGlass,
  },
  optionChipSelected: {
    borderColor: "rgba(34, 197, 94, 0.28)",
    backgroundColor: colors.primarySoft,
  },
  optionChipText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  optionChipTextSelected: {
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
    backgroundColor: colors.background,
  },
  actionButton: {
    flex: 1,
  },
});
