import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  TouchableOpacity as BottomSheetTouchableOpacity,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import type { MainLift } from "@ownlift/schemas";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState, type ComponentRef } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import {
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
  normalizeHistoryLiftFilter,
  useHistoryFilterStore,
  type HistoryFilterOption,
  type HistoryListLiftFilterValue,
} from "../../../src/history/history-filter-store";
import { t, useLocale } from "../../../src/i18n";

const MAIN_LIFT_KEYS: readonly MainLift[] = ["squat", "bench", "deadlift", "press"];

function isMainLiftKey(key: string): key is MainLift {
  return MAIN_LIFT_KEYS.includes(key as MainLift);
}

function getLiftFilterSelectedKeys(value: HistoryListLiftFilterValue): string[] {
  return value === "all" ? ["all"] : value;
}

function normalizeLiftFilterForOptions(
  value: HistoryListLiftFilterValue,
  options: HistoryFilterOption[],
): HistoryListLiftFilterValue {
  if (value === "all") return "all";

  const availableLiftKeys = new Set(options.map((option) => option.key));
  return normalizeHistoryLiftFilter(value.filter((lift) => availableLiftKeys.has(lift)));
}

function FilterOptionSection({
  title,
  options,
  selectedKeys,
  onSelect,
}: {
  title: string;
  options: HistoryFilterOption[];
  selectedKeys: readonly string[];
  onSelect: (key: string) => void;
}) {
  return (
    <Section title={title} titleStyle={styles.sectionTitle}>
      <Card style={styles.card}>
        <View style={styles.optionGrid}>
          {options.map((option) => {
            const isSelected = selectedKeys.includes(option.key);

            return (
              <BottomSheetTouchableOpacity
                key={option.key}
                activeOpacity={0.82}
                style={[
                  styles.optionChip,
                  isSelected && styles.optionChipSelected,
                ]}
                onPress={() => onSelect(option.key)}
              >
                <Text style={[styles.optionChipText, isSelected && styles.optionChipTextSelected]}>
                  {option.label}
                </Text>
              </BottomSheetTouchableOpacity>
            );
          })}
        </View>
      </Card>
    </Section>
  );
}

function FilterSheetAction({
  title,
  variant = "secondary",
  onPress,
}: {
  title: string;
  variant?: "primary" | "secondary";
  onPress: () => void;
}) {
  return (
    <BottomSheetTouchableOpacity
      activeOpacity={0.84}
      onPress={onPress}
      style={[
        styles.actionTouchable,
        variant === "primary" && styles.actionTouchablePrimary,
      ]}
    >
      <Text
        style={[
          styles.actionText,
          variant === "primary" && styles.actionTextPrimary,
        ]}
      >
        {title}
      </Text>
    </BottomSheetTouchableOpacity>
  );
}

export default function HistoryFilterScreen() {
  useLocale();

  const router = useRouter();
  const { height } = useWindowDimensions();
  const filterSheetRef = useRef<ComponentRef<typeof BottomSheet>>(null);
  const isClosingRouteRef = useRef(false);
  const monthOptions = useHistoryFilterStore((state) => state.monthOptions);
  const liftOptions = useHistoryFilterStore((state) => state.liftOptions);
  const selectedMonthKey = useHistoryFilterStore((state) => state.selectedMonthKey);
  const selectedListLifts = useHistoryFilterStore((state) => state.selectedListLifts);
  const setSelectedMonthKey = useHistoryFilterStore((state) => state.setSelectedMonthKey);
  const setSelectedListLifts = useHistoryFilterStore((state) => state.setSelectedListLifts);

  const resolvedMonthOptions = monthOptions.length > 0
    ? monthOptions
    : [{ key: "all", label: t("history.filter.all") }];
  const resolvedLiftOptions = liftOptions.length > 0
    ? liftOptions
    : [{ key: "all", label: t("history.filter.all") }];
  const initialMonthKey = resolvedMonthOptions.some((option) => option.key === selectedMonthKey)
    ? selectedMonthKey
    : "all";
  const initialListLifts = normalizeLiftFilterForOptions(selectedListLifts, resolvedLiftOptions);
  const maxSheetHeight = useMemo(() => Math.round(height * 0.84), [height]);

  const [draftMonthKey, setDraftMonthKey] = useState(initialMonthKey);
  const [draftListLifts, setDraftListLifts] = useState<HistoryListLiftFilterValue>(initialListLifts);
  const draftListLiftSelectedKeys = useMemo(
    () => getLiftFilterSelectedKeys(draftListLifts),
    [draftListLifts],
  );

  const closeRoute = useCallback(() => {
    if (isClosingRouteRef.current) return;

    isClosingRouteRef.current = true;
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/history");
  }, [router]);

  const renderBackdrop = useCallback((props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={0.48}
      pressBehavior="close"
    />
  ), []);

  function handleReset(): void {
    setDraftMonthKey("all");
    setDraftListLifts("all");
  }

  function handleApply(): void {
    setSelectedMonthKey(draftMonthKey);
    setSelectedListLifts(draftListLifts);
    handleClose();
  }

  function handleSelectListLift(key: string): void {
    if (key === "all") {
      setDraftListLifts("all");
      return;
    }

    if (!isMainLiftKey(key)) return;

    setDraftListLifts((current) => {
      if (current === "all") {
        return [key];
      }

      const nextListLifts = current.includes(key)
        ? current.filter((lift) => lift !== key)
        : [...current, key];

      return normalizeHistoryLiftFilter(nextListLifts);
    });
  }

  function handleClose(): void {
    if (filterSheetRef.current) {
      filterSheetRef.current.close();
      return;
    }

    closeRoute();
  }

  return (
    <View style={styles.screen}>
      <BottomSheet
        ref={filterSheetRef}
        index={0}
        enableDynamicSizing
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandleIndicator}
        maxDynamicContentSize={maxSheetHeight}
        onClose={closeRoute}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{t("history.filter.title")}</Text>
              <Text style={styles.helper} variant="body">
                {t("history.filter.helper")}
              </Text>
            </View>

            <BottomSheetTouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.82}
              onPress={handleClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>{t("common.cancel")}</Text>
            </BottomSheetTouchableOpacity>
          </View>

          <FilterOptionSection
            title={t("history.filter.period")}
            options={resolvedMonthOptions}
            selectedKeys={[draftMonthKey]}
            onSelect={setDraftMonthKey}
          />

          <FilterOptionSection
            title={t("history.filter.exercise")}
            options={resolvedLiftOptions}
            selectedKeys={draftListLiftSelectedKeys}
            onSelect={handleSelectListLift}
          />

          <View style={styles.actions}>
            <FilterSheetAction
              title={t("history.filter.reset")}
              onPress={handleReset}
            />
            <FilterSheetAction
              title={t("history.filter.apply")}
              variant="primary"
              onPress={handleApply}
            />
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.transparent,
  },
  sheetBackground: {
    borderWidth: 1,
    backgroundColor: colors.surface,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  sheetHandleIndicator: {
    width: 44,
    backgroundColor: colors.borderStrong,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
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
  closeButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  sheetContent: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
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
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.lg,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  optionChipSelected: {
    borderWidth: 1,
    borderColor: "rgba(214, 255, 96, 0.28)",
    backgroundColor: "rgba(214, 255, 96, 0.12)",
  },
  optionChipText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: 18,
  },
  optionChipTextSelected: {
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  actionTouchable: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  actionTouchablePrimary: {
    backgroundColor: colors.primary,
  },
  actionText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  actionTextPrimary: {
    color: colors.primaryForeground,
  },
});
