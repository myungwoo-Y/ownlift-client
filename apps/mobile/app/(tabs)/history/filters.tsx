import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  TouchableOpacity as BottomSheetTouchableOpacity,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
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
  const filterSheetRef = useRef<ComponentRef<typeof BottomSheetModal>>(null);
  const isClosingRouteRef = useRef(false);
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
  const maxSheetHeight = useMemo(() => Math.round(height * 0.84), [height]);

  const [draftMonthKey, setDraftMonthKey] = useState(initialMonthKey);
  const [draftListLift, setDraftListLift] = useState<HistoryListLiftFilter>(initialListLift);

  useEffect(() => {
    filterSheetRef.current?.present();
  }, []);

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
    setDraftListLift("all");
  }

  function handleApply(): void {
    setSelectedMonthKey(draftMonthKey);
    setSelectedListLift(draftListLift);
    handleClose();
  }

  function handleClose(): void {
    if (filterSheetRef.current) {
      filterSheetRef.current.dismiss();
      return;
    }

    closeRoute();
  }

  return (
    <View style={styles.screen}>
      <BottomSheetModal
        ref={filterSheetRef}
        enableDynamicSizing
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandleIndicator}
        maxDynamicContentSize={maxSheetHeight}
        onDismiss={closeRoute}
      >
        <BottomSheetView style={styles.header}>
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
        </BottomSheetView>

        <BottomSheetScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
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
        </BottomSheetScrollView>

        <BottomSheetView style={styles.actions}>
          <FilterSheetAction
            title={t("history.filter.reset")}
            onPress={handleReset}
          />
          <FilterSheetAction
            title={t("history.filter.apply")}
            variant="primary"
            onPress={handleApply}
          />
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  sheetBackground: {
    borderWidth: 1,
    backgroundColor: colors.surfaceGlassStrong,
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
  closeButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
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
