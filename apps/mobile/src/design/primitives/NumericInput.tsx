import { forwardRef } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type ReturnKeyTypeOptions,
  type TextInputSubmitEditingEventData,
} from "react-native";
import { borderRadius, colors, fontSize, spacing } from "../tokens";
import { Text } from "./Text";

interface NumericInputProps {
  value: string;
  onChangeText: (text: string) => void;
  unit?: string;
  placeholder?: string;
  editable?: boolean;
  onSubmitEditing?: (event: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => void;
  onFocus?: () => void;
  returnKeyType?: ReturnKeyTypeOptions;
  blurOnSubmit?: boolean;
}

export const NumericInput = forwardRef<TextInput, NumericInputProps>(function NumericInput({
  value,
  onChangeText,
  unit,
  placeholder,
  editable = true,
  onSubmitEditing,
  onFocus,
  returnKeyType,
  blurOnSubmit,
}, ref) {
  return (
    <View style={styles.container}>
      <TextInput
        ref={ref}
        style={[styles.input, !editable && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        onFocus={onFocus}
        keyboardType="numeric"
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        editable={editable}
        selectTextOnFocus
        returnKeyType={returnKeyType}
        blurOnSubmit={blurOnSubmit}
      />
      {unit ? <Text style={styles.unit}>{unit}</Text> : null}
    </View>
  );
});

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
    fontFamily: "Inter_500Medium",
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
