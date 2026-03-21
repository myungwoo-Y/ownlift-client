import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, type PressableProps, type ViewStyle } from "react-native";
import { borderRadius, colors, spacing } from "../tokens";

interface BackButtonProps extends Omit<PressableProps, "children"> {
  accessibilityLabel?: string;
}

export function BackButton({
  accessibilityLabel = "Back",
  style,
  disabled,
  ...rest
}: BackButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style as ViewStyle,
      ]}
      disabled={disabled}
      {...rest}
    >
      <Ionicons name="chevron-back" size={28} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginLeft: spacing.lg,
    boxShadow: "0px 12px 30px rgba(0, 0, 0, 0.22)",
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.4,
  },
});
