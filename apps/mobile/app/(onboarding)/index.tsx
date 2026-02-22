import type { RoundingMode, WeightUnit } from "@ownlift/schemas";
import { DEFAULT_SETTINGS } from "@ownlift/schemas";
import { useRouter } from "expo-router";
import { useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { Button, Divider, Section, SegmentedControl, Text, colors, spacing } from "../../src/design";

export default function OnboardingStep1() {
  const router = useRouter();
  const [unit, setUnit] = useState<WeightUnit>(DEFAULT_SETTINGS.unit);
  const [roundingMode, setRoundingMode] = useState<RoundingMode>(DEFAULT_SETTINGS.roundingMode);

  const roundingIncrement = unit === "kg"
    ? DEFAULT_SETTINGS.roundingIncrement.kg
    : DEFAULT_SETTINGS.roundingIncrement.lb;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text variant="title">Welcome to OwnLift</Text>
          <Text variant="subtitle">Let's set up your 5/3/1 program</Text>
        </View>

        <Section title="WEIGHT UNIT">
          <SegmentedControl
            options={["kg", "lb"]}
            selectedIndex={unit === "kg" ? 0 : 1}
            onSelect={(i) => setUnit(i === 0 ? "kg" : "lb")}
          />
          <Text variant="caption">
            Rounding: {roundingIncrement} {unit} ({roundingMode})
          </Text>
        </Section>

        <Divider />

        <Section title="ROUNDING MODE">
          <SegmentedControl
            options={["Nearest", "Down", "Up"]}
            selectedIndex={["nearest", "down", "up"].indexOf(roundingMode)}
            onSelect={(i) =>
              setRoundingMode((["nearest", "down", "up"] as const)[i])
            }
          />
        </Section>

        <View style={styles.spacer} />

        <Button
          title="Next → Training Maxes"
          onPress={() =>
            router.push({
              pathname: "/(onboarding)/training-max",
              params: { unit, roundingMode },
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
  spacer: {
    flex: 1,
  },
});
