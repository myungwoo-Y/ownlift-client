import type { MainLift } from "@ownlift/schemas";
import { create } from "zustand";

export interface HistoryFilterOption {
  key: string;
  label: string;
}

export type HistoryListLiftFilter = MainLift | "all";

interface HistoryFilterStore {
  selectedMonthKey: string;
  selectedListLift: HistoryListLiftFilter;
  monthOptions: HistoryFilterOption[];
  liftOptions: HistoryFilterOption[];
  setSelectedMonthKey: (value: string) => void;
  setSelectedListLift: (value: HistoryListLiftFilter) => void;
  setAvailableOptions: (monthOptions: HistoryFilterOption[], liftOptions: HistoryFilterOption[]) => void;
  resetFilters: () => void;
}

export const useHistoryFilterStore = create<HistoryFilterStore>((set) => ({
  selectedMonthKey: "all",
  selectedListLift: "all",
  monthOptions: [],
  liftOptions: [],

  setSelectedMonthKey: (value) => {
    set({ selectedMonthKey: value });
  },

  setSelectedListLift: (value) => {
    set({ selectedListLift: value });
  },

  setAvailableOptions: (monthOptions, liftOptions) => {
    set({ monthOptions, liftOptions });
  },

  resetFilters: () => {
    set({
      selectedMonthKey: "all",
      selectedListLift: "all",
    });
  },
}));
