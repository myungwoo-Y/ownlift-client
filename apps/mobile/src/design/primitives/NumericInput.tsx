import { StyleSheet, TextInput, View } from "react-native";
import { borderRadius, colors, fontSize, fontWeight, spacing } from "../tokens";
import { Text } from "./Text";

interface NumericInputProps {
  value: string;
  onChangeText: (text: string) => void;
  unit?: string;
  placeholder?: string;
  editable?: boolean;
}

export function NumericInput({
  value,
  onChangeText,
  unit,
  placeholder,
  editable = true,
}: NumericInputProps) {
  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        editable={editable}
        selectTextOnFocus
      />
      {unit ? <Text style={styles.unit}>{unit}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.text,
    minWidth: 72,
    textAlign: "center",
  },
  inputDisabled: {
    opacity: 0.6,
  },
  unit: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
