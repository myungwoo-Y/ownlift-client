import { updateInstanceState } from "@ownlift/db";
import type { MainLift } from "@ownlift/schemas";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    Divider,
    Section,
    SegmentedControl, Stepper,
    Text,
    borderRadius,
    colors, fontSize, fontWeight,
    spacing,
} from "../../src/design";
import { getLiftLabel, t, useLocale } from "../../src/i18n";
import { syncLiftPrescriptions } from "../../src/program/prescription-sync";
import { useProgramStore } from "../../src/stores/program-store";
import { useSettingsStore } from "../../src/stores/settings-store";

const LIFTS: readonly MainLift[] = ["squat", "bench", "deadlift", "press"];

export default function SettingsScreen() {
  const locale = useLocale();

  const { instance, stubs, loadProgram } = useProgramStore();
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const settings = useSettingsStore();

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
    await settings.updateSetting("unit", newUnit);
  };

  const handleLocaleChange = async (index: number) => {
    const nextLocale = index === 0 ? "en" : "ko";
    await settings.updateSetting("locale", nextLocale);
  };

  const handleIncrementChange = async (key: string, delta: number) => {
    const current = key === "tmIncreaseUpper" ? settings.tmIncreaseUpper : settings.tmIncreaseLower;
    const newVal = Math.max(0, current + delta);
    await settings.updateSetting(key, String(newVal));
  };

  return (
    <SafeAreaView key={locale} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text variant="title">{t("settings.title")}</Text>
        </View>

        <Divider />

        {/* Training Maxes */}
        <Section title={t("settings.section.trainingMax")}>
          <Text variant="caption">{t("settings.trainingMaxHint")}</Text>
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

        <Divider />

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

        <Divider />

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

        <Divider />

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

        <Divider />

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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    gap: spacing.lg,
    paddingHorizontal: spacing["2xl"],
    paddingBottom: spacing["5xl"],
  },
  header: {
    paddingTop: spacing["3xl"],
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
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
});
