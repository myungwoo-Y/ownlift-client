import { StyleSheet, View } from "react-native";
import { borderRadius, colors, fontSize, fontWeight, spacing } from "../tokens";
import { Text } from "./Text";

type BadgeVariant = "default" | "completed" | "today" | "planned" | "amrap" | "pr";
type BadgeSize = "default" | "compact";

interface BadgeProps {
  variant: BadgeVariant;
  label: string;
  size?: BadgeSize;
}

export function Badge({ variant, label, size = "default" }: BadgeProps) {
  return (
    <View style={[styles.base, sizeStyles[size], variantStyles[variant]]}>
      <Text style={[styles.text, textSizeStyles[size], variantTextStyles[variant]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: "center",
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});

const sizeStyles = StyleSheet.create({
  default: {},
  compact: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
  },
});

const textSizeStyles = StyleSheet.create({
  default: {},
  compact: {
    fontSize: 10,
  },
});

const variantStyles = StyleSheet.create({
  default: { backgroundColor: colors.surface },
  completed: { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
  today: { backgroundColor: colors.primary },
  planned: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  amrap: { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
  pr: { backgroundColor: colors.accent },
});

const variantTextStyles = StyleSheet.create({
  default: { color: colors.text },
  completed: { color: colors.text },
  today: { color: colors.primaryForeground },
  planned: { color: colors.textSecondary },
  amrap: { color: colors.accent },
  pr: { color: colors.accentForeground },
});
