import { updateInstanceState, type OwnLiftDataBackup } from "@ownlift/db";
import type { MainLift } from "@ownlift/schemas";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { exportBackupFile, importBackupFile, pickBackupFile } from "../../../src/data/backup-files";
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
import { formatDate, getLiftLabel, t, useLocale } from "../../../src/i18n";
import { syncLiftPrescriptions } from "../../../src/program/prescription-sync";
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

  const { instance, stubs, loadProgram } = useProgramStore();
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const settings = useSettingsStore();
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [isImportingBackup, setIsImportingBackup] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void loadSettings();
    }, [loadSettings]),
  );

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
    if (newUnit === settings.unit) {
      return;
    }

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

  const handleBackupError = (titleKey: Parameters<typeof t>[0], error: unknown) => {
    Alert.alert(
      t(titleKey),
      error instanceof Error ? error.message : t("settings.dataUnknownError"),
    );
  };

  const handleExportBackup = async () => {
    try {
      setIsExportingBackup(true);
      const result = await exportBackupFile();

      Alert.alert(
        t("settings.dataExportSuccessTitle"),
        result.shared
          ? t("settings.dataExportSuccessMessage", { rows: result.summary.totalRows })
          : t("settings.dataExportSavedMessage", { file: result.fileName }),
      );
    } catch (error) {
      handleBackupError("settings.dataExportFailedTitle", error);
    } finally {
      setIsExportingBackup(false);
    }
  };

  const handleImportConfirmed = async (backup: OwnLiftDataBackup) => {
    try {
      setIsImportingBackup(true);
      const summary = await importBackupFile(backup);
      await loadSettings();
      await loadProgram();

      Alert.alert(
        t("settings.dataImportSuccessTitle"),
        t("settings.dataImportSuccessMessage", { rows: summary.totalRows }),
      );
    } catch (error) {
      handleBackupError("settings.dataImportFailedTitle", error);
    } finally {
      setIsImportingBackup(false);
    }
  };

  const handleImportBackup = async () => {
    try {
      const picked = await pickBackupFile();
      if (!picked) return;

      Alert.alert(
        t("settings.dataImportConfirmTitle"),
        t("settings.dataImportConfirmMessage", {
          file: picked.fileName,
          rows: picked.summary.totalRows,
          exportedAt: formatDate(picked.summary.exportedAt, {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        }),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("settings.dataImportConfirmAction"),
            style: "destructive",
            onPress: () => {
              void handleImportConfirmed(picked.backup);
            },
          },
        ],
      );
    } catch (error) {
      handleBackupError("settings.dataImportFailedTitle", error);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      style={styles.safe}
    >
      <Section title={t("settings.section.units")}>
        <SegmentedControl
          options={["kg", "lb"]}
          selectedIndex={settings.unit === "kg" ? 0 : 1}
          onSelect={handleUnitChange}
          size="large"
        />
      </Section>

      <Section title={t("settings.section.language")}>
        <SegmentedControl
          options={[t("language.en"), t("language.ko")]}
          selectedIndex={settings.locale === "en" ? 0 : 1}
          onSelect={handleLocaleChange}
          size="large"
        />
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
              valueSize="compact"
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
              valueSize="compact"
              onIncrement={() => handleIncrementChange("tmIncreaseUpper", settings.unit === "kg" ? 0.5 : 2.5)}
              onDecrement={() => handleIncrementChange("tmIncreaseUpper", -(settings.unit === "kg" ? 0.5 : 2.5))}
            />
          </View>
          <View style={styles.cardSeparator} />
          <View style={styles.incRow}>
            <View style={styles.incLabel}>
              <Text variant="body">{t("settings.lowerBody")}</Text>
              <Text variant="caption">{t("settings.lowerBodyHint")}</Text>
            </View>
            <Stepper
              value={settings.tmIncreaseLower}
              unit={settings.unit}
              valueSize="compact"
              onIncrement={() => handleIncrementChange("tmIncreaseLower", settings.unit === "kg" ? 0.5 : 2.5)}
              onDecrement={() => handleIncrementChange("tmIncreaseLower", -(settings.unit === "kg" ? 0.5 : 2.5))}
            />
          </View>
        </View>
      </Section>

      {/* Training Maxes */}
      <Section title={t("settings.section.trainingMax")}>
        <View style={styles.card}>
          {LIFTS.map((lift, index) => {
            const isLast = index === LIFTS.length - 1;

            return (
              <View key={lift}>
                <Pressable
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
                {!isLast ? <View style={styles.cardSeparator} /> : null}
              </View>
            );
          })}
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
        </View>
      </Section>

      <Section title={t("settings.section.data")}>
        <View style={styles.card}>
          <View style={styles.dataBlock}>
            <View style={styles.dataCopy}>
              <Text variant="caption">{t("settings.dataBackupHint")}</Text>
            </View>
            <View style={styles.dataActions}>
              <Button
                title={isExportingBackup ? t("settings.dataExporting") : t("settings.dataExport")}
                variant="secondary"
                disabled={isExportingBackup || isImportingBackup}
                onPress={() => {
                  void handleExportBackup();
                }}
              />
              <Button
                title={isImportingBackup ? t("settings.dataImporting") : t("settings.dataImport")}
                variant="ghost"
                disabled={isExportingBackup || isImportingBackup}
                onPress={() => {
                  void handleImportBackup();
                }}
              />
            </View>
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
  },
  cardSeparator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.border,
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
  incRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
  dataBlock: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  dataCopy: {
    gap: spacing.xs,
  },
  dataActions: {
    gap: spacing.sm,
  },
});
