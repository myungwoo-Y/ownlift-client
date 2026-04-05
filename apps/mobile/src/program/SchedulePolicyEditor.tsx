import { REQUIRED_SCHEDULED_DAYS, type ProgramScheduleMode, type ProgramWeekday } from "@ownlift/schemas";
import { Pressable, StyleSheet, View } from "react-native";
import { SegmentedControl, Text, borderRadius, colors, fontSize, fontWeight, spacing } from "../design";
import { getWeekdayShortLabel, t, useLocale } from "../i18n";
import { normalizeScheduledDays, WEEKDAY_SELECTION_ORDER } from "./schedule-policy";

interface SchedulePolicyEditorProps {
  mode: ProgramScheduleMode;
  scheduledDays: readonly ProgramWeekday[];
  disabled?: boolean;
  onModeChange: (mode: ProgramScheduleMode) => void;
  onScheduledDaysChange: (days: ProgramWeekday[]) => void;
}

export function SchedulePolicyEditor({
  mode,
  scheduledDays,
  disabled = false,
  onModeChange,
  onScheduledDaysChange,
}: SchedulePolicyEditorProps) {
  useLocale();

  const normalizedDays = normalizeScheduledDays(scheduledDays);

  function handleToggleDay(day: ProgramWeekday) {
    if (disabled) {
      return;
    }

    if (normalizedDays.includes(day)) {
      onScheduledDaysChange(normalizedDays.filter((item) => item !== day));
      return;
    }

    if (normalizedDays.length >= REQUIRED_SCHEDULED_DAYS) {
      return;
    }

    onScheduledDaysChange(normalizeScheduledDays([...normalizedDays, day]));
  }

  return (
    <View style={styles.container}>
      <View pointerEvents={disabled ? "none" : "auto"} style={disabled ? styles.disabledControl : null}>
        <SegmentedControl
          options={[t("schedule.mode.flexible.title"), t("schedule.mode.scheduled.title")]}
          selectedIndex={mode === "flexible" ? 0 : 1}
          onSelect={(index) => onModeChange(index === 0 ? "flexible" : "scheduled")}
        />
      </View>

      <Text variant="caption" style={styles.description}>
        {mode === "flexible"
          ? t("schedule.mode.flexible.description")
          : t("schedule.mode.scheduled.description")}
      </Text>

      {mode === "scheduled" ? (
        <View style={styles.daysSection}>
          <Text variant="caption">{t("schedule.days.label")}</Text>
          <View style={styles.dayList}>
            {WEEKDAY_SELECTION_ORDER.map((day) => {
              const isSelected = normalizedDays.includes(day);

              return (
                <Pressable
                  key={day}
                  accessibilityRole="button"
                  accessibilityState={{ disabled, selected: isSelected }}
                  style={[
                    styles.dayChip,
                    isSelected ? styles.dayChipSelected : null,
                    disabled ? styles.dayChipDisabled : null,
                  ]}
                  disabled={disabled}
                  onPress={() => handleToggleDay(day)}
                >
                  <Text style={[styles.dayChipText, isSelected ? styles.dayChipTextSelected : null]}>
                    {getWeekdayShortLabel(day)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  description: {
    marginTop: -spacing.xs,
  },
  disabledControl: {
    opacity: 0.6,
  },
  daysSection: {
    gap: spacing.sm,
  },
  dayList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  dayChip: {
    minWidth: 48,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  dayChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  dayChipDisabled: {
    opacity: 0.6,
  },
  dayChipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  dayChipTextSelected: {
    color: colors.primaryForeground,
  },
});
