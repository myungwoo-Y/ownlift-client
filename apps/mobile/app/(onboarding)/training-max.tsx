import type { RoundingMode, WeightUnit } from "@ownlift/schemas";
import { DEFAULT_SETTINGS } from "@ownlift/schemas";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Divider,
  NumericInput, Section,
  Stepper,
  Text,
  colors,
  spacing,
} from "../../src/design";
import { getLiftLabel, t, useLocale } from "../../src/i18n";

export default function OnboardingStep2() {
  useLocale();

  const router = useRouter();
  const params = useLocalSearchParams<{ unit: WeightUnit; roundingMode: RoundingMode }>();
  const unit = params.unit ?? "kg";

  const [squat, setSquat] = useState("");
  const [bench, setBench] = useState("");
  const [deadlift, setDeadlift] = useState("");
  const [press, setPress] = useState("");

  const defaultInc = unit === "kg" ? DEFAULT_SETTINGS.tmIncreaseUpper.kg : DEFAULT_SETTINGS.tmIncreaseUpper.lb;
  const defaultIncLower = unit === "kg" ? DEFAULT_SETTINGS.tmIncreaseLower.kg : DEFAULT_SETTINGS.tmIncreaseLower.lb;

  const [tmIncUpper, setTmIncUpper] = useState<number>(defaultInc);
  const [tmIncLower, setTmIncLower] = useState<number>(defaultIncLower);

  const allFilled = squat && bench && deadlift && press;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text variant="title">{t("onboarding.step2.title")}</Text>
          <Text variant="caption">
            {t("onboarding.step2.subtitle")}
          </Text>
        </View>

        <Section title={t("onboarding.section.trainingMax")}>
          {([
            { key: "squat" as const, value: squat, onChange: setSquat },
            { key: "bench" as const, value: bench, onChange: setBench },
            { key: "deadlift" as const, value: deadlift, onChange: setDeadlift },
            { key: "press" as const, value: press, onChange: setPress },
          ] as const).map((lift) => (
            <View key={lift.key} style={styles.liftRow}>
              <Text variant="body" style={styles.liftLabel}>{getLiftLabel(lift.key)}</Text>
              <NumericInput
                value={lift.value}
                onChangeText={lift.onChange}
                unit={unit}
                placeholder="0"
              />
            </View>
          ))}
        </Section>

        <Divider />

        <Section title={t("onboarding.section.tmIncreasePerCycle")}>
          <View style={styles.incRow}>
            <View style={styles.incLabel}>
              <Text variant="body">{t("settings.upperBody")}</Text>
              <Text variant="caption">{t("settings.upperBodyHint")}</Text>
            </View>
            <Stepper
              value={tmIncUpper}
              unit={unit}
              onIncrement={() => setTmIncUpper((v) => v + (unit === "kg" ? 0.5 : 2.5))}
              onDecrement={() => setTmIncUpper((v) => Math.max(0, v - (unit === "kg" ? 0.5 : 2.5)))}
            />
          </View>
          <View style={styles.incRow}>
            <View style={styles.incLabel}>
              <Text variant="body">{t("settings.lowerBody")}</Text>
              <Text variant="caption">{t("settings.lowerBodyHint")}</Text>
            </View>
            <Stepper
              value={tmIncLower}
              unit={unit}
              onIncrement={() => setTmIncLower((v) => v + (unit === "kg" ? 0.5 : 2.5))}
              onDecrement={() => setTmIncLower((v) => Math.max(0, v - (unit === "kg" ? 0.5 : 2.5)))}
            />
          </View>
        </Section>

        <View style={styles.spacer} />

        <Button
          title={t("onboarding.nextCustomize")}
          disabled={!allFilled}
          onPress={() =>
            router.push({
              pathname: "/(onboarding)/customize",
              params: {
                unit,
                roundingMode: params.roundingMode ?? "nearest",
                squat,
                bench,
                deadlift,
                press,
                tmIncUpper: String(tmIncUpper),
                tmIncLower: String(tmIncLower),
              },
            })
          }
        />
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
    padding: spacing["2xl"],
    gap: spacing["2xl"],
    flexGrow: 1,
  },
  header: {
    gap: spacing.sm,
    paddingTop: spacing["3xl"],
  },
  liftRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  liftLabel: {
    flex: 1,
  },
  incRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  incLabel: {
    flex: 1,
    gap: 2,
  },
  spacer: {
    flex: 1,
  },
});
