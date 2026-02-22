import { getAllSettings, setSetting } from "@ownlift/db";
import type { RoundingMode, WeightUnit } from "@ownlift/schemas";
import { DEFAULT_SETTINGS } from "@ownlift/schemas";
import { create } from "zustand";

interface SettingsStore {
  unit: WeightUnit;
  roundingIncrement: number;
  roundingMode: RoundingMode;
  tmIncreaseUpper: number;
  tmIncreaseLower: number;
  warmUpEnabled: boolean;
  includeDeload: boolean;
  isLoading: boolean;

  loadSettings: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  unit: DEFAULT_SETTINGS.unit,
  roundingIncrement: DEFAULT_SETTINGS.roundingIncrement.kg,
  roundingMode: DEFAULT_SETTINGS.roundingMode,
  tmIncreaseUpper: DEFAULT_SETTINGS.tmIncreaseUpper.kg,
  tmIncreaseLower: DEFAULT_SETTINGS.tmIncreaseLower.kg,
  warmUpEnabled: DEFAULT_SETTINGS.warmUpEnabled,
  includeDeload: true,
  isLoading: true,

  loadSettings: async () => {
    const raw = await getAllSettings();
    set({
      unit: (raw.unit as WeightUnit) ?? DEFAULT_SETTINGS.unit,
      roundingIncrement: raw.roundingIncrement
        ? parseFloat(raw.roundingIncrement)
        : DEFAULT_SETTINGS.roundingIncrement.kg,
      roundingMode: (raw.roundingMode as RoundingMode) ?? DEFAULT_SETTINGS.roundingMode,
      tmIncreaseUpper: raw.tmIncreaseUpper
        ? parseFloat(raw.tmIncreaseUpper)
        : DEFAULT_SETTINGS.tmIncreaseUpper.kg,
      tmIncreaseLower: raw.tmIncreaseLower
        ? parseFloat(raw.tmIncreaseLower)
        : DEFAULT_SETTINGS.tmIncreaseLower.kg,
      warmUpEnabled: raw.warmUpEnabled !== "false",
      includeDeload: raw.includeDeload !== "false",
      isLoading: false,
    });
  },

  updateSetting: async (key, value) => {
    await setSetting({ key, value });

    // Update local state based on key
    set((state) => {
      switch (key) {
        case "unit":
          return { unit: value as WeightUnit };
        case "roundingIncrement":
          return { roundingIncrement: parseFloat(value) };
        case "roundingMode":
          return { roundingMode: value as RoundingMode };
        case "tmIncreaseUpper":
          return { tmIncreaseUpper: parseFloat(value) };
        case "tmIncreaseLower":
          return { tmIncreaseLower: parseFloat(value) };
        case "warmUpEnabled":
          return { warmUpEnabled: value === "true" };
        case "includeDeload":
          return { includeDeload: value === "true" };
        default:
          return {};
      }
    });
  },
}));
