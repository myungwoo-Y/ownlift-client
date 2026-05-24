import { getSetLogsBySession, getWorkoutResultBySession } from "@ownlift/db";
import type { MainLift } from "@ownlift/schemas";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SectionList, View } from "react-native";
import { Text } from "../../../src/design";
import {
  normalizeHistoryLiftFilter,
  normalizeHistoryMonthFilter,
  useHistoryFilterStore,
  type HistoryListLiftFilterValue,
  type HistoryListMonthFilterValue,
} from "../../../src/history/history-filter-store";
import { HistoryEmptyState } from "../../../src/history/history-screen/HistoryEmptyState";
import { HistoryListHeader } from "../../../src/history/history-screen/HistoryListHeader";
import { HistoryListItem } from "../../../src/history/history-screen/HistoryListItem";
import { HistorySummarySection } from "../../../src/history/history-screen/HistorySummarySection";
import { styles } from "../../../src/history/history-screen/styles";
import type {
  ActiveFilterChip,
  HistoryItem,
  HistoryMonthSection,
} from "../../../src/history/history-screen/types";
import {
  buildHistoryMonthSections,
  buildLiftFilterOptions,
  buildMonthFilterOptions,
  getFilterOptionLabel,
  getHistoryItemDate,
  getHistoryMonthKey,
  getSessionEstimatedOneRepMax,
  getSessionLastWorkSetMetric,
} from "../../../src/history/history-screen/utils";
import { buildMockHistoryItems } from "../../../src/history/mock-history";
import { useLocale } from "../../../src/i18n";
import { useProgramStore } from "../../../src/stores/program-store";

export default function HistoryScreen() {
  useLocale();

  const router = useRouter();
  const { stubs, instance } = useProgramStore();
  const selectedMonthKeys = useHistoryFilterStore((state) => state.selectedMonthKeys);
  const selectedListLifts = useHistoryFilterStore((state) => state.selectedListLifts);
  const setSelectedMonthKeys = useHistoryFilterStore((state) => state.setSelectedMonthKeys);
  const setSelectedListLifts = useHistoryFilterStore((state) => state.setSelectedListLifts);
  const setAvailableOptions = useHistoryFilterStore((state) => state.setAvailableOptions);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [selectedLift, setSelectedLift] = useState<MainLift>("deadlift");

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function load() {
        const completedStubs = stubs.filter((stub) => stub.status === "completed");
        const enriched = await Promise.all(
          completedStubs.map(async (stub) => {
            const [result, logs] = await Promise.all([
              getWorkoutResultBySession(stub.sessionId),
              getSetLogsBySession(stub.sessionId),
            ]);

            return {
              ...stub,
              completedAt: result?.completedAt,
              totalVolume: result?.summary?.totalVolume ?? undefined,
              estimatedOneRepMax: getSessionEstimatedOneRepMax(logs),
              lastWorkSet: getSessionLastWorkSetMetric(logs),
            } satisfies HistoryItem;
          }),
        );

        enriched.sort((a, b) =>
          (b.completedAt ?? b.scheduledDate ?? "").localeCompare(a.completedAt ?? a.scheduledDate ?? ""),
        );

        const nextItems = enriched.length === 0 && __DEV__ && instance
          ? buildMockHistoryItems(instance)
          : enriched;

        if (isActive) {
          setItems(nextItems);
        }
      }

      void load();

      return () => {
        isActive = false;
      };
    }, [instance, stubs]),
  );

  const monthFilterOptions = useMemo(() => buildMonthFilterOptions(items), [items]);
  const liftFilterOptions = useMemo(() => buildLiftFilterOptions(items), [items]);

  useEffect(() => {
    setAvailableOptions(monthFilterOptions, liftFilterOptions);
  }, [liftFilterOptions, monthFilterOptions, setAvailableOptions]);

  const activeMonthKeys = useMemo<HistoryListMonthFilterValue>(() => {
    if (selectedMonthKeys === "all") return "all";

    const availableMonthKeys = new Set(monthFilterOptions.map((option) => option.key));
    const nextMonthKeys = selectedMonthKeys.filter((key) => availableMonthKeys.has(key));
    const totalOptionsCount = monthFilterOptions.filter(opt => opt.key !== "all").length;

    return normalizeHistoryMonthFilter(nextMonthKeys, totalOptionsCount);
  }, [monthFilterOptions, selectedMonthKeys]);
  const activeListLifts = useMemo<HistoryListLiftFilterValue>(() => {
    if (selectedListLifts === "all") return "all";

    const availableLiftKeys = new Set(liftFilterOptions.map((option) => option.key));
    const nextListLifts = selectedListLifts.filter((lift) => availableLiftKeys.has(lift));

    return normalizeHistoryLiftFilter(nextListLifts);
  }, [liftFilterOptions, selectedListLifts]);
  const unitLabel = instance?.params.unit ?? "kg";

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const itemMonthKey = getHistoryMonthKey(getHistoryItemDate(item));
        const matchesMonth =
          activeMonthKeys === "all" ||
          (itemMonthKey !== null && activeMonthKeys.includes(itemMonthKey));
        const matchesLift = activeListLifts === "all" || activeListLifts.includes(item.mainLiftKey);
        return matchesMonth && matchesLift;
      }),
    [activeListLifts, activeMonthKeys, items],
  );
  const historySections = useMemo(
    () => buildHistoryMonthSections(filteredItems),
    [filteredItems],
  );

  const hasActiveFilters = activeMonthKeys !== "all" || activeListLifts !== "all";
  const activeFilterChips = useMemo<ActiveFilterChip[]>(
    () =>
      [
        ...(activeMonthKeys === "all"
          ? []
          : activeMonthKeys.map((monthKey) => ({
              key: `month-${monthKey}`,
              label: getFilterOptionLabel(monthFilterOptions, monthKey) ?? monthKey,
              onRemove: () => {
                setSelectedMonthKeys(
                  activeMonthKeys.filter((selectedKey) => selectedKey !== monthKey),
                );
              },
            }))),
        ...(activeListLifts === "all"
          ? []
          : activeListLifts.map((lift) => ({
              key: `lift-${lift}`,
              label: getFilterOptionLabel(liftFilterOptions, lift) ?? lift,
              onRemove: () => {
                setSelectedListLifts(activeListLifts.filter((selectedLift) => selectedLift !== lift));
              },
            }))),
      ].filter((chip): chip is ActiveFilterChip => Boolean(chip)),
    [
      activeListLifts,
      activeMonthKeys,
      liftFilterOptions,
      monthFilterOptions,
      setSelectedListLifts,
      setSelectedMonthKeys,
    ],
  );
  const activeFilterCount = activeFilterChips.length;

  const handleOpenFilters = useCallback(() => {
    router.push("/(tabs)/history/filters");
  }, [router]);

  const handlePressSession = useCallback((sessionId: string) => {
    router.push({
      pathname: "/session/[sessionId]",
      params: { sessionId, source: "history" },
    });
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: HistoryItem }) => (
      <HistoryListItem
        item={item}
        onPressSession={handlePressSession}
        unitLabel={unitLabel}
      />
    ),
    [handlePressSession, unitLabel],
  );
  const renderSectionHeader = useCallback(
    ({ section }: { section: HistoryMonthSection }) => (
      <View style={styles.monthSectionHeader}>
        <Text style={styles.monthSectionTitle}>{section.title}</Text>
      </View>
    ),
    [],
  );

  const keyExtractor = useCallback((item: HistoryItem) => item.sessionId, []);
  const hasItems = items.length > 0;
  const listHeader = useMemo(
    () => (
      <HistoryListHeader
        activeFilterChips={activeFilterChips}
        activeFilterCount={activeFilterCount}
        hasItems={hasItems}
        onOpenFilters={handleOpenFilters}
      >
        <HistorySummarySection
          items={items}
          onSelectLift={setSelectedLift}
          selectedLift={selectedLift}
          unit={unitLabel}
        />
      </HistoryListHeader>
    ),
    [
      activeFilterChips,
      activeFilterCount,
      handleOpenFilters,
      hasItems,
      items,
      selectedLift,
      unitLabel,
    ],
  );
  const emptyState = useMemo(
    () => (
      <View style={styles.empty}>
        <HistoryEmptyState
          hasActiveFilters={hasActiveFilters}
          itemCount={items.length}
        />
      </View>
    ),
    [hasActiveFilters, items.length],
  );

  return (
    <SectionList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.listContent}
      keyExtractor={keyExtractor}
      ListEmptyComponent={emptyState}
      ListHeaderComponent={listHeader}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      sections={historySections}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
      style={styles.safe}
    />
  );
}
