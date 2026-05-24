import { getAllSettings, setSetting } from "@ownlift/db";
import type { RoundingMode, SettingsKey, WeightUnit } from "@ownlift/schemas";
import { DEFAULT_SETTINGS } from "@ownlift/schemas";
import { create } from "zustand";
import { getLocale, isAppLocale, setLocale, type AppLocale } from "../i18n";

function isWeightUnit(value: string | undefined): value is WeightUnit {
  return value === "kg" || value === "lb";
}

function parsePositiveNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;

  const parsed = parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

interface SettingsStore {
  locale: AppLocale;
  pendingLocale: AppLocale | null;
  unit: WeightUnit;
  roundingIncrement: number;
  roundingMode: RoundingMode;
  tmIncreaseUpper: number;
  tmIncreaseLower: number;
  restTimerSeconds: number;
  warmUpEnabled: boolean;
  includeDeload: boolean;
  isLoading: boolean;

  loadSettings: () => Promise<void>;
  updateSetting: (key: SettingsKey, value: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  locale: getLocale(),
  pendingLocale: null,
  unit: DEFAULT_SETTINGS.unit,
  roundingIncrement: DEFAULT_SETTINGS.roundingIncrement.kg,
  roundingMode: DEFAULT_SETTINGS.roundingMode,
  tmIncreaseUpper: DEFAULT_SETTINGS.tmIncreaseUpper.kg,
  tmIncreaseLower: DEFAULT_SETTINGS.tmIncreaseLower.kg,
  restTimerSeconds: DEFAULT_SETTINGS.restTimerSeconds,
  warmUpEnabled: DEFAULT_SETTINGS.warmUpEnabled,
  includeDeload: true,
  isLoading: true,

  loadSettings: async () => {
    const raw = await getAllSettings();
    const storedLocale = raw.locale === "en" || raw.locale === "ko" ? raw.locale : null;
    const pendingLocale = get().pendingLocale;
    const locale = pendingLocale ?? storedLocale ?? getLocale();
    const unit = isWeightUnit(raw.unit) ? raw.unit : DEFAULT_SETTINGS.unit;
    const parsedRestTimerSeconds = raw.restTimerSeconds ? parseFloat(raw.restTimerSeconds) : NaN;
    setLocale(locale);

    set({
      locale,
      pendingLocale: pendingLocale && storedLocale === pendingLocale ? null : pendingLocale,
      unit,
      roundingIncrement: parsePositiveNumber(raw.roundingIncrement, DEFAULT_SETTINGS.roundingIncrement[unit]),
      roundingMode: (raw.roundingMode as RoundingMode) ?? DEFAULT_SETTINGS.roundingMode,
      tmIncreaseUpper: parsePositiveNumber(raw.tmIncreaseUpper, DEFAULT_SETTINGS.tmIncreaseUpper[unit]),
      tmIncreaseLower: parsePositiveNumber(raw.tmIncreaseLower, DEFAULT_SETTINGS.tmIncreaseLower[unit]),
      restTimerSeconds: Number.isFinite(parsedRestTimerSeconds) && parsedRestTimerSeconds > 0
        ? parsedRestTimerSeconds
        : DEFAULT_SETTINGS.restTimerSeconds,
      warmUpEnabled: raw.warmUpEnabled !== "false",
      includeDeload: raw.includeDeload !== "false",
      isLoading: false,
    });
  },

  updateSetting: async (key, value) => {
    if (key === "locale" && isAppLocale(value)) {
      const previousLocale = get().locale;

      // Apply locale immediately so UI updates without waiting for DB persistence.
      setLocale(value);
      set({ locale: value, pendingLocale: value });

      try {
        await setSetting({ key, value });
        set((state) => (state.pendingLocale === value ? { locale: value, pendingLocale: null } : {}));
      } catch (error) {
        if (get().pendingLocale === value) {
          setLocale(previousLocale);
          set({ locale: previousLocale, pendingLocale: null });
        }

        throw error;
      }

      return;
    }

    if (key === "unit" && isWeightUnit(value)) {
      const roundingIncrement = DEFAULT_SETTINGS.roundingIncrement[value];
      const tmIncreaseUpper = DEFAULT_SETTINGS.tmIncreaseUpper[value];
      const tmIncreaseLower = DEFAULT_SETTINGS.tmIncreaseLower[value];

      await setSetting({ key, value });
      await setSetting({ key: "roundingIncrement", value: String(roundingIncrement) });
      await setSetting({ key: "tmIncreaseUpper", value: String(tmIncreaseUpper) });
      await setSetting({ key: "tmIncreaseLower", value: String(tmIncreaseLower) });

      set({
        unit: value,
        roundingIncrement,
        tmIncreaseUpper,
        tmIncreaseLower,
      });
      return;
    }

    await setSetting({ key, value });

    // Update local state based on key
    set(() => {
      switch (key) {
        case "unit":
          return { unit: value as WeightUnit };
        case "locale":
          return {};
        case "roundingIncrement":
          return { roundingIncrement: parseFloat(value) };
        case "roundingMode":
          return { roundingMode: value as RoundingMode };
        case "tmIncreaseUpper":
          return { tmIncreaseUpper: parseFloat(value) };
        case "tmIncreaseLower":
          return { tmIncreaseLower: parseFloat(value) };
        case "restTimerSeconds":
          return { restTimerSeconds: parseFloat(value) };
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
