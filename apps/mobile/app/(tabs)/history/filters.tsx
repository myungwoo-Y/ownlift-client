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
import {
  useHistoryFilterStore,
  type HistoryFilterOption,
  type HistoryListLiftFilter,
} from "../../../src/history/history-filter-store";
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
    <Section title={title} titleStyle={styles.sectionTitle}>
      <Card style={styles.card}>
        <View style={styles.optionGrid}>
          {options.map((option) => {
            const isSelected = option.key === selectedKey;

            return (
              <Pressable
                key={option.key}
                style={({ pressed }) => [
                  styles.optionChip,
                  isSelected && styles.optionChipSelected,
                  pressed ? styles.optionChipPressed : null,
                ]}
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
    handleClose();
  }

  function handleClose(): void {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/history");
  }

  return (
    <View style={styles.overlay}>
      <Pressable
        accessibilityRole="button"
        onPress={handleClose}
        style={styles.backdrop}
      />

      <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{t("history.filter.title")}</Text>
              <Text style={styles.helper} variant="body">
                {t("history.filter.helper")}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={handleClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed ? styles.closeButtonPressed : null,
              ]}
            >
              <Text style={styles.closeButtonText}>{t("common.cancel")}</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
          >
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
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(4, 5, 8, 0.38)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    width: "100%",
  },
  sheet: {
    maxHeight: "84%",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderCurve: "continuous",
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255, 255, 255, 0.06)",
    backgroundColor: colors.surfaceGlassStrong,
    boxShadow: "0px -18px 44px rgba(0, 0, 0, 0.28)",
    overflow: "hidden",
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    marginTop: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.text,
    lineHeight: 28,
  },
  helper: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
  closeButton: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  closeButtonPressed: {
    opacity: 0.82,
  },
  closeButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  scroll: {
    flexGrow: 0,
  },
  container: {
    paddingHorizontal: spacing["2xl"],
    paddingBottom: spacing["2xl"],
    gap: spacing["2xl"],
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    lineHeight: 24,
    color: colors.text,
  },
  card: {
    gap: spacing.md,
    borderRadius: 28,
    borderCurve: "continuous",
    backgroundColor: colors.surfaceElevated,
    borderColor: "rgba(255, 255, 255, 0.05)",
    boxShadow: "0px 18px 36px rgba(0, 0, 0, 0.18)",
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  optionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 40,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  optionChipPressed: {
    transform: [{ scale: 0.98 }],
  },
  optionChipSelected: {
    borderColor: "rgba(214, 255, 96, 0.28)",
    backgroundColor: "rgba(214, 255, 96, 0.12)",
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
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  actionButton: {
    flex: 1,
  },
});
