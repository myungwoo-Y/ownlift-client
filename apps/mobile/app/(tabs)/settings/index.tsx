import { updateInstanceState } from "@ownlift/db";
import type { MainLift, ProgramScheduleMode, ProgramWeekday } from "@ownlift/schemas";
import { DEFAULT_SETTINGS, REQUIRED_SCHEDULED_DAYS } from "@ownlift/schemas";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import {
  Button,
  Section,
  SegmentedControl,
  Stepper,
  Text,
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  spacing,
} from "../../../src/design";
import { getLiftLabel, t, useLocale } from "../../../src/i18n";
import { SchedulePolicyEditor } from "../../../src/program/SchedulePolicyEditor";
import { syncLiftPrescriptions } from "../../../src/program/prescription-sync";
import { hasRequiredScheduledDays, normalizeScheduledDays } from "../../../src/program/schedule-policy";
import { useProgramStore } from "../../../src/stores/program-store";
import { useSettingsStore } from "../../../src/stores/settings-store";

const LIFTS: readonly MainLift[] = ["squat", "bench", "deadlift", "press"];
const REST_TIMER_STEP_SECONDS = 30;

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

export default function SettingsScreen() {
  useLocale();

  const { instance, stubs, loadProgram, updateSchedulePolicy } = useProgramStore();
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const settings = useSettingsStore();
  const scheduleMode = instance?.params.scheduleMode ?? DEFAULT_SETTINGS.scheduleMode;
  const scheduledDays = instance?.params.scheduledDays ?? DEFAULT_SETTINGS.scheduledDays;
  const [draftScheduleMode, setDraftScheduleMode] = useState<ProgramScheduleMode>(scheduleMode);
  const [draftScheduledDays, setDraftScheduledDays] = useState<ProgramWeekday[]>([...scheduledDays]);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const normalizedSavedDays = normalizeScheduledDays(scheduledDays);
  const normalizedDraftDays = normalizeScheduledDays(draftScheduledDays);
  const isScheduledDraftValid = draftScheduleMode !== "scheduled" || hasRequiredScheduledDays(normalizedDraftDays);
  const isScheduleDirty = draftScheduleMode !== scheduleMode
    || normalizedDraftDays.join(",") !== normalizedSavedDays.join(",");

  useFocusEffect(
    useCallback(() => {
      void loadSettings();
    }, [loadSettings]),
  );

  useEffect(() => {
    setDraftScheduleMode(scheduleMode);
    setDraftScheduledDays([...scheduledDays]);
    setIsSavingSchedule(false);
  }, [scheduleMode, scheduledDays]);

  const handleTmEdit = (lift: MainLift) => {
    if (!instance) return;
    const currentTm = instance.state.trainingMaxes[lift];
    Alert.prompt(
      t("settings.editTmTitle", { lift: getLiftLabel(lift) }),
      t("settings.editTmMessage", { tm: currentTm, unit: settings.unit }),
      async (text) => {
        const newTm = parseFloat(text ?? "");
        if (isNaN(newTm) || newTm <= 0) return;
        const newTMs = { ...instance.state.trainingMaxes, [lift]: newTm };
        const newState = { ...instance.state, trainingMaxes: newTMs };
        await updateInstanceState({ instanceId: instance.instanceId, state: newState });
        await syncLiftPrescriptions({
          instance,
          stubs,
          lift,
          state: newState,
        });
        await loadProgram();
      },
      "plain-text",
      String(currentTm),
      "numeric",
    );
  };

  const handleUnitChange = async (index: number) => {
    const newUnit = index === 0 ? "kg" : "lb";
    await settings.updateSetting("unit", newUnit);
  };

  const handleLocaleChange = async (index: number) => {
    const nextLocale = index === 0 ? "en" : "ko";
    if (nextLocale === settings.locale) {
      return;
    }

    await settings.updateSetting("locale", nextLocale);
    Alert.alert(
      t("settings.languageChangedTitle"),
      t("settings.languageChangedMessage", {
        language: t(nextLocale === "ko" ? "language.ko" : "language.en"),
      }),
    );
  };

  const handleIncrementChange = async (key: "tmIncreaseUpper" | "tmIncreaseLower", delta: number) => {
    const current = key === "tmIncreaseUpper" ? settings.tmIncreaseUpper : settings.tmIncreaseLower;
    const newVal = Math.max(0, current + delta);
    await settings.updateSetting(key, String(newVal));
  };

  const handleRestTimerChange = async (delta: number) => {
    const newValue = Math.max(REST_TIMER_STEP_SECONDS, settings.restTimerSeconds + delta);
    await settings.updateSetting("restTimerSeconds", String(newValue));
  };

  const handleScheduleSave = async () => {
    if (!instance || !isScheduleDirty) return;
    if (!isScheduledDraftValid) {
      Alert.alert(
        t("schedule.saveBlockedTitle"),
        t("schedule.days.requiredHint", { total: REQUIRED_SCHEDULED_DAYS }),
      );
      return;
    }

    try {
      setIsSavingSchedule(true);
      await updateSchedulePolicy(draftScheduleMode, normalizedDraftDays);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      style={styles.safe}
    >

      {/* Training Maxes */}
      <Section title={t("settings.section.trainingMax")}>
        <View style={styles.card}>
          {LIFTS.map((lift) => (
            <Pressable
              key={lift}
              style={styles.tmRow}
              onPress={() => handleTmEdit(lift)}
            >
              <Text variant="body">{getLiftLabel(lift)}</Text>
              <View style={styles.tmValue}>
                <Text style={styles.tmNumber}>
                  {instance ? String(instance.state.trainingMaxes[lift]) : "—"} {settings.unit}
                </Text>
                <Text style={styles.chevron}>›</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </Section>

      {/* Units */}
      <Section title={t("settings.section.units")}>
        <View style={styles.card}>
          <View style={styles.unitRow}>
            <View style={styles.unitLabel}>
              <Text variant="body">{t("settings.weightUnit")}</Text>
              <Text variant="caption">{t("settings.weightUnitHint")}</Text>
            </View>
            <SegmentedControl
              options={["kg", "lb"]}
              selectedIndex={settings.unit === "kg" ? 0 : 1}
              onSelect={handleUnitChange}
            />
          </View>
        </View>
      </Section>

      <Section title={t("settings.section.language")}>
        <View style={styles.card}>
          <View style={styles.unitRow}>
            <View style={styles.unitLabel}>
              <Text variant="body">{t("settings.languageLabel")}</Text>
            </View>
            <SegmentedControl
              options={[t("language.en"), t("language.ko")]}
              selectedIndex={settings.locale === "en" ? 0 : 1}
              onSelect={handleLocaleChange}
            />
          </View>
        </View>
      </Section>

      <Section title={t("settings.section.workout")}>
        <View style={styles.card}>
          <View style={styles.incRow}>
            <View style={styles.incLabel}>
              <Text variant="body">{t("settings.restTimerDefault")}</Text>
              <Text variant="caption">{t("settings.restTimerHint")}</Text>
            </View>
            <Stepper
              value={settings.restTimerSeconds}
              displayValue={formatDuration(settings.restTimerSeconds)}
              min={REST_TIMER_STEP_SECONDS}
              onIncrement={() => {
                void handleRestTimerChange(REST_TIMER_STEP_SECONDS);
              }}
              onDecrement={() => {
                void handleRestTimerChange(-REST_TIMER_STEP_SECONDS);
              }}
            />
          </View>
        </View>
      </Section>

      {/* Increments */}
      <Section title={t("settings.section.increments")}>
        <View style={styles.card}>
          <View style={styles.incRow}>
            <View style={styles.incLabel}>
              <Text variant="body">{t("settings.upperBody")}</Text>
              <Text variant="caption">{t("settings.upperBodyHint")}</Text>
            </View>
            <Stepper
              value={settings.tmIncreaseUpper}
              unit={settings.unit}
              onIncrement={() => handleIncrementChange("tmIncreaseUpper", settings.unit === "kg" ? 0.5 : 2.5)}
              onDecrement={() => handleIncrementChange("tmIncreaseUpper", -(settings.unit === "kg" ? 0.5 : 2.5))}
            />
          </View>
          <View style={styles.incRow}>
            <View style={styles.incLabel}>
              <Text variant="body">{t("settings.lowerBody")}</Text>
              <Text variant="caption">{t("settings.lowerBodyHint")}</Text>
            </View>
            <Stepper
              value={settings.tmIncreaseLower}
              unit={settings.unit}
              onIncrement={() => handleIncrementChange("tmIncreaseLower", settings.unit === "kg" ? 0.5 : 2.5)}
              onDecrement={() => handleIncrementChange("tmIncreaseLower", -(settings.unit === "kg" ? 0.5 : 2.5))}
            />
          </View>
        </View>
      </Section>

      {/* Program */}
      <Section title={t("settings.section.program")}>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text variant="body">{t("settings.deloadWeek")}</Text>
              <Text variant="caption">{t("settings.deloadHint")}</Text>
            </View>
            <Switch
              value={settings.includeDeload}
              onValueChange={async (v) => {
                await settings.updateSetting("includeDeload", String(v));
              }}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={settings.includeDeload ? colors.accentForeground : colors.surfaceElevated}
            />
          </View>
          <View style={styles.policyDivider} />
          <View style={styles.policyEditor}>
            <Text variant="body">{t("schedule.section.title")}</Text>
            <SchedulePolicyEditor
              mode={draftScheduleMode}
              scheduledDays={draftScheduledDays}
              disabled={!instance || isSavingSchedule}
              onModeChange={setDraftScheduleMode}
              onScheduledDaysChange={setDraftScheduledDays}
            />
            {draftScheduleMode === "scheduled" ? (
              <>
                <Text variant="caption" style={styles.scheduleCount}>
                  {t("schedule.days.selectedCount", {
                    count: normalizedDraftDays.length,
                    total: REQUIRED_SCHEDULED_DAYS,
                  })}
                </Text>
                <Text
                  variant="caption"
                  style={isScheduledDraftValid ? styles.scheduleHint : styles.scheduleError}
                >
                  {isScheduledDraftValid
                    ? t("schedule.days.saveHint")
                    : t("schedule.days.requiredHint", { total: REQUIRED_SCHEDULED_DAYS })}
                </Text>
              </>
            ) : null}
            <Button
              title={isSavingSchedule ? t("schedule.saving") : t("schedule.save")}
              disabled={!instance || isSavingSchedule || !isScheduleDirty}
              onPress={() => {
                void handleScheduleSave();
              }}
            />
          </View>
        </View>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    gap: spacing["3xl"],
    paddingHorizontal: spacing["2xl"],
    paddingBottom: spacing["4xl"],
  },
  header: {
    paddingTop: spacing["2xl"],
    gap: spacing.xs,
  },
  headerEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.textTertiary,
  },
  card: {
    backgroundColor: colors.surfaceGlassStrong,
    borderRadius: borderRadius.xl,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    overflow: "hidden",
  },
  tmRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tmValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  tmNumber: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  chevron: {
    fontSize: 20,
    color: colors.textTertiary,
  },
  unitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
  },
  unitLabel: {
    flex: 1,
    gap: 2,
  },
  incRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  incLabel: {
    flex: 1,
    gap: 2,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
  },
  switchLabel: {
    flex: 1,
    gap: 2,
  },
  policyDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  policyEditor: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  scheduleCount: {
    color: colors.textSecondary,
  },
  scheduleHint: {
    color: colors.textSecondary,
  },
  scheduleError: {
    color: colors.destructive,
  },
});
