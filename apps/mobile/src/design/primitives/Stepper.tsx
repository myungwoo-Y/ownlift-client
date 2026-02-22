import { Pressable, StyleSheet, View } from "react-native";
import { borderRadius, colors, fontSize, fontWeight, spacing } from "../tokens";
import { Text } from "./Text";

interface StepperProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  unit?: string;
  min?: number;
}

export function Stepper({ value, onIncrement, onDecrement, unit, min = 0 }: StepperProps) {
  const canDecrement = value > min;

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.button, !canDecrement && styles.buttonDisabled]}
        onPress={onDecrement}
        disabled={!canDecrement}
      >
        <Text style={styles.buttonText}>−</Text>
      </Pressable>
      <Text style={styles.value}>
        {String(value)}{unit ? ` ${unit}` : ""}
      </Text>
      <Pressable style={styles.button} onPress={onIncrement}>
        <Text style={styles.buttonText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
    color: colors.text,
    lineHeight: 24,
  },
  value: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    minWidth: 60,
    textAlign: "center",
  },
});
