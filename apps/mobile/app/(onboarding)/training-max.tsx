import type { MainLift, RoundingMode, WeightUnit } from "@ownlift/schemas";
import { DEFAULT_SETTINGS } from "@ownlift/schemas";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import {
    Button,
    Divider,
    NumericInput, Section,
    Stepper,
    Text,
    colors,
    spacing,
} from "../../src/design";

const LIFT_LABELS: Record<MainLift, string> = {
  squat: "Squat",
  bench: "Bench Press",
  deadlift: "Deadlift",
  press: "Press",
};

export default function OnboardingStep2() {
  const router = useRouter();
  const params = useLocalSearchParams<{ unit: WeightUnit; roundingMode: RoundingMode }>();
  const unit = params.unit ?? "kg";

  const [squat, setSquat] = useState("");
  const [bench, setBench] = useState("");
  const [deadlift, setDeadlift] = useState("");
  const [press, setPress] = useState("");

  const defaultInc = unit === "kg" ? DEFAULT_SETTINGS.tmIncreaseUpper.kg : DEFAULT_SETTINGS.tmIncreaseUpper.lb;
  const defaultIncLower = unit === "kg" ? DEFAULT_SETTINGS.tmIncreaseLower.kg : DEFAULT_SETTINGS.tmIncreaseLower.lb;

  const [tmIncUpper, setTmIncUpper] = useState(defaultInc);
  const [tmIncLower, setTmIncLower] = useState(defaultIncLower);

  const allFilled = squat && bench && deadlift && press;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text variant="title">Training Maxes</Text>
          <Text variant="caption">
            Typically 85–90% of your true 1RM
          </Text>
        </View>

        <Section title="TRAINING MAX (TM)">
          {([
            { key: "squat" as const, label: "Squat", value: squat, onChange: setSquat },
            { key: "bench" as const, label: "Bench Press", value: bench, onChange: setBench },
            { key: "deadlift" as const, label: "Deadlift", value: deadlift, onChange: setDeadlift },
            { key: "press" as const, label: "Press", value: press, onChange: setPress },
          ] as const).map((lift) => (
            <View key={lift.key} style={styles.liftRow}>
              <Text variant="body" style={styles.liftLabel}>{lift.label}</Text>
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

        <Section title="TM INCREASE PER CYCLE">
          <View style={styles.incRow}>
            <View style={styles.incLabel}>
              <Text variant="body">Upper Body</Text>
              <Text variant="caption">Press, Bench Press</Text>
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
              <Text variant="body">Lower Body</Text>
              <Text variant="caption">Squat, Deadlift</Text>
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
          title="Next → Customize"
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
