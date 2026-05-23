import { Pressable, StyleSheet, View } from "react-native";
import { borderRadius, colors, fontSize, fontWeight, motion, spacing } from "../tokens";
import { Text } from "./Text";

interface StepperProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  displayValue?: string;
  unit?: string;
  min?: number;
  valueSize?: "default" | "compact";
}

const STEP_BUTTON_SIZE = spacing["4xl"] + spacing.xs;
const STEP_VALUE_WIDTH = spacing["5xl"] + spacing["2xl"];
const STEP_CONTROL_WIDTH = STEP_BUTTON_SIZE * 2 + STEP_VALUE_WIDTH + spacing.md * 2;

export function Stepper({
  value,
  onIncrement,
  onDecrement,
  displayValue,
  unit,
  min = 0,
  valueSize = "default",
}: StepperProps) {
  const canDecrement = value > min;

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && canDecrement && styles.buttonPressed,
          !canDecrement && styles.buttonDisabled,
        ]}
        onPress={onDecrement}
        disabled={!canDecrement}
      >
        <Text style={styles.buttonText}>−</Text>
      </Pressable>
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.84}
        numberOfLines={1}
        style={[
          styles.value,
          valueSize === "compact" && styles.valueCompact,
        ]}
      >
        {displayValue ?? `${String(value)}${unit ? ` ${unit}` : ""}`}
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        onPress={onIncrement}
      >
        <Text style={styles.buttonText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    justifyContent: "space-between",
    width: STEP_CONTROL_WIDTH,
  },
  button: {
    width: STEP_BUTTON_SIZE,
    height: STEP_BUTTON_SIZE,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonPressed: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderStrong,
    opacity: 0.9,
    transform: [{ scale: motion.scale.press }],
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
    color: colors.text,
    lineHeight: fontSize["2xl"],
  },
  value: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: "center",
    width: STEP_VALUE_WIDTH,
  },
  valueCompact: {
    fontSize: fontSize.xl,
  },
});
