import { Pressable, type PressableProps, StyleSheet, type ViewStyle } from "react-native";
import { borderRadius, colors, fontSize, fontWeight, spacing } from "../tokens";
import { Text } from "./Text";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "children"> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ title, variant = "primary", size = "lg", style, disabled, ...rest }: ButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
        style as ViewStyle,
      ]}
      disabled={disabled}
      {...rest}
    >
      <Text
        style={[
          styles.text,
          sizeTextStyles[size],
          variantTextStyles[variant],
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.full,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    fontWeight: fontWeight.semibold,
  },
});

const sizeStyles = StyleSheet.create({
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  md: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing["2xl"] },
});

const sizeTextStyles = StyleSheet.create({
  sm: { fontSize: fontSize.sm },
  md: { fontSize: fontSize.md },
  lg: { fontSize: fontSize.lg },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    boxShadow: "0px 16px 36px rgba(34, 197, 94, 0.22)",
  },
  secondary: {
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  ghost: { backgroundColor: "rgba(255, 255, 255, 0.04)" },
});

const variantTextStyles = StyleSheet.create({
  primary: { color: colors.primaryForeground },
  secondary: { color: colors.text },
  ghost: { color: colors.text },
});
