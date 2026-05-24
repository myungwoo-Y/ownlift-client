import type { MainLift } from "@ownlift/schemas";
import { create } from "zustand";

export interface HistoryFilterOption {
  key: string;
  label: string;
}

export type HistoryListLiftFilterValue = MainLift[] | "all";
export type HistoryListMonthFilterValue = string[] | "all";
export type HistoryListYearFilterValue = string[] | "all";

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

export function normalizeHistoryYearFilter(
  value: HistoryListYearFilterValue,
  totalOptionsCount: number,
): HistoryListYearFilterValue {
  if (value === "all") return "all";

  const uniqueValues = Array.from(new Set(value));
  if (uniqueValues.length === 0 || uniqueValues.length >= totalOptionsCount) {
    return "all";
  }

  return uniqueValues;
}

interface HistoryFilterStore {
  selectedYearKeys: HistoryListYearFilterValue;
  selectedMonthKeys: HistoryListMonthFilterValue;
  selectedListLifts: HistoryListLiftFilterValue;
  yearOptions: HistoryFilterOption[];
  monthOptions: HistoryFilterOption[];
  liftOptions: HistoryFilterOption[];
  setSelectedYearKeys: (value: HistoryListYearFilterValue) => void;
  setSelectedMonthKeys: (value: HistoryListMonthFilterValue) => void;
  setSelectedListLifts: (value: HistoryListLiftFilterValue) => void;
  setAvailableOptions: (
    yearOptions: HistoryFilterOption[],
    monthOptions: HistoryFilterOption[],
    liftOptions: HistoryFilterOption[],
  ) => void;
  resetFilters: () => void;
}

export const useHistoryFilterStore = create<HistoryFilterStore>((set) => ({
  selectedYearKeys: [String(new Date().getFullYear())],
  selectedMonthKeys: "all",
  selectedListLifts: "all",
  yearOptions: [],
  monthOptions: [],
  liftOptions: [],

  setSelectedYearKeys: (value) => {
    set({ selectedYearKeys: value });
  },

  setSelectedMonthKeys: (value) => {
    set({ selectedMonthKeys: value });
  },

  setSelectedListLifts: (value) => {
    set({ selectedListLifts: normalizeHistoryLiftFilter(value) });
  },

  setAvailableOptions: (yearOptions, monthOptions, liftOptions) => {
    set({ yearOptions, monthOptions, liftOptions });
  },

  resetFilters: () => {
    set({
      selectedYearKeys: [String(new Date().getFullYear())],
      selectedMonthKeys: "all",
      selectedListLifts: "all",
    });
  },
}));
