import type { MainLift } from "@ownlift/schemas";
import { create } from "zustand";

export interface HistoryFilterOption {
  key: string;
  label: string;
}

export type HistoryListLiftFilterValue = MainLift[] | "all";

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

interface HistoryFilterStore {
  selectedMonthKey: string;
  selectedListLifts: HistoryListLiftFilterValue;
  monthOptions: HistoryFilterOption[];
  liftOptions: HistoryFilterOption[];
  setSelectedMonthKey: (value: string) => void;
  setSelectedListLifts: (value: HistoryListLiftFilterValue) => void;
  setAvailableOptions: (monthOptions: HistoryFilterOption[], liftOptions: HistoryFilterOption[]) => void;
  resetFilters: () => void;
}

export const useHistoryFilterStore = create<HistoryFilterStore>((set) => ({
  selectedMonthKey: "all",
  selectedListLifts: "all",
  monthOptions: [],
  liftOptions: [],

  setSelectedMonthKey: (value) => {
    set({ selectedMonthKey: value });
  },

  setSelectedListLifts: (value) => {
    set({ selectedListLifts: normalizeHistoryLiftFilter(value) });
  },

  setAvailableOptions: (monthOptions, liftOptions) => {
    set({ monthOptions, liftOptions });
  },

  resetFilters: () => {
    set({
      selectedMonthKey: "all",
      selectedListLifts: "all",
    });
  },
}));
