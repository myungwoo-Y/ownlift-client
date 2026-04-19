import { getSetLogsBySession, getWorkoutResultBySession } from "@ownlift/db";
import type { MainLift } from "@ownlift/schemas";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useHistoryFilterStore } from "../../../src/history/history-filter-store";
import { HistoryEmptyState } from "../../../src/history/history-screen/HistoryEmptyState";
import { HistoryFlatList } from "../../../src/history/history-screen/HistoryFlatList";
import { HistoryListHeader } from "../../../src/history/history-screen/HistoryListHeader";
import { HistoryListItem } from "../../../src/history/history-screen/HistoryListItem";
import { HistorySummarySection } from "../../../src/history/history-screen/HistorySummarySection";
import type { ActiveFilterChip, HistoryItem } from "../../../src/history/history-screen/types";
import {
  buildLiftFilterOptions,
  buildMonthFilterOptions,
  getFilterOptionLabel,
  getHistoryItemDate,
  getHistoryMonthKey,
  getSessionEstimatedOneRepMax,
} from "../../../src/history/history-screen/utils";
import { buildMockHistoryItems } from "../../../src/history/mock-history";
import { useLocale } from "../../../src/i18n";
import { useProgramStore } from "../../../src/stores/program-store";

export default function HistoryScreen() {
  useLocale();

  const router = useRouter();
  const { stubs, instance } = useProgramStore();
  const selectedMonthKey = useHistoryFilterStore((state) => state.selectedMonthKey);
  const selectedListLift = useHistoryFilterStore((state) => state.selectedListLift);
  const setSelectedMonthKey = useHistoryFilterStore((state) => state.setSelectedMonthKey);
  const setSelectedListLift = useHistoryFilterStore((state) => state.setSelectedListLift);
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

  const activeMonthKey = monthFilterOptions.some((option) => option.key === selectedMonthKey)
    ? selectedMonthKey
    : "all";
  const activeListLift = liftFilterOptions.some((option) => option.key === selectedListLift)
    ? selectedListLift
    : "all";
  const unitLabel = instance?.params.unit ?? "kg";

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const itemMonthKey = getHistoryMonthKey(getHistoryItemDate(item));
        const matchesMonth = activeMonthKey === "all" || itemMonthKey === activeMonthKey;
        const matchesLift = activeListLift === "all" || item.mainLiftKey === activeListLift;
        return matchesMonth && matchesLift;
      }),
    [activeListLift, activeMonthKey, items],
  );

  const hasActiveFilters = activeMonthKey !== "all" || activeListLift !== "all";
  const activeFilterCount = Number(activeMonthKey !== "all") + Number(activeListLift !== "all");
  const activeFilterChips = useMemo<ActiveFilterChip[]>(
    () =>
      [
        activeMonthKey !== "all"
          ? {
            key: "month",
            label: getFilterOptionLabel(monthFilterOptions, activeMonthKey) ?? activeMonthKey,
            onRemove: () => setSelectedMonthKey("all"),
          }
          : null,
        activeListLift !== "all"
          ? {
            key: "lift",
            label: getFilterOptionLabel(liftFilterOptions, activeListLift) ?? activeListLift,
            onRemove: () => setSelectedListLift("all"),
          }
          : null,
      ].filter((chip): chip is ActiveFilterChip => Boolean(chip)),
    [
      activeListLift,
      activeMonthKey,
      liftFilterOptions,
      monthFilterOptions,
      setSelectedListLift,
      setSelectedMonthKey,
    ],
  );

  const handleOpenFilters = useCallback(() => {
    router.push("/(tabs)/history/filters");
  }, [router]);

  const handlePressSession = useCallback((sessionId: string) => {
    router.push(`/session/${sessionId}`);
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

  const keyExtractor = useCallback((item: HistoryItem) => item.sessionId, []);
  const hasItems = items.length > 0;

  return (
    <HistoryFlatList
      data={filteredItems}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
    >
      <HistoryFlatList.Header>
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
      </HistoryFlatList.Header>

      <HistoryFlatList.Empty>
        <HistoryEmptyState
          hasActiveFilters={hasActiveFilters}
          itemCount={items.length}
        />
      </HistoryFlatList.Empty>
    </HistoryFlatList>
  );
}
