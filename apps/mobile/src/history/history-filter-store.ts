import type { MainLift } from "@ownlift/schemas";
import { create } from "zustand";

export interface HistoryFilterOption {
  key: string;
  label: string;
}

export type HistoryListLiftFilterValue = MainLift[] | "all";
export type HistoryListMonthFilterValue = string[] | "all";

const MAIN_LIFT_COUNT = 4;

export function normalizeHistoryLiftFilter(
  value: HistoryListLiftFilterValue,
): HistoryListLiftFilterValue {
  if (value === "all") return "all";

  const uniqueValues = Array.from(new Set(value));
  if (uniqueValues.length === 0 || uniqueValues.length >= MAIN_LIFT_COUNT) {
    return "all";
  }

  return uniqueValues;
}

export function normalizeHistoryMonthFilter(
  value: HistoryListMonthFilterValue,
  totalOptionsCount: number,
): HistoryListMonthFilterValue {
  if (value === "all") return "all";

  const uniqueValues = Array.from(new Set(value));
  if (uniqueValues.length === 0 || uniqueValues.length >= totalOptionsCount) {
    return "all";
  }

  return uniqueValues;
}

interface HistoryFilterStore {
  selectedMonthKeys: HistoryListMonthFilterValue;
  selectedListLifts: HistoryListLiftFilterValue;
  monthOptions: HistoryFilterOption[];
  liftOptions: HistoryFilterOption[];
  setSelectedMonthKeys: (value: HistoryListMonthFilterValue) => void;
  setSelectedListLifts: (value: HistoryListLiftFilterValue) => void;
  setAvailableOptions: (monthOptions: HistoryFilterOption[], liftOptions: HistoryFilterOption[]) => void;
  resetFilters: () => void;
}

export const useHistoryFilterStore = create<HistoryFilterStore>((set) => ({
  selectedMonthKeys: "all",
  selectedListLifts: "all",
  monthOptions: [],
  liftOptions: [],

  setSelectedMonthKeys: (value) => {
    set({ selectedMonthKeys: value });
  },

  setSelectedListLifts: (value) => {
    set({ selectedListLifts: normalizeHistoryLiftFilter(value) });
  },

  setAvailableOptions: (monthOptions, liftOptions) => {
    set({ monthOptions, liftOptions });
  },

  resetFilters: () => {
    set({
      selectedMonthKeys: "all",
      selectedListLifts: "all",
    });
  },
}));
