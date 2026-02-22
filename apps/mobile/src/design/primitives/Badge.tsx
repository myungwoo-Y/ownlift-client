import { StyleSheet, View } from "react-native";
import { borderRadius, colors, fontSize, fontWeight, spacing } from "../tokens";
import { Text } from "./Text";

type BadgeVariant = "default" | "completed" | "today" | "planned" | "amrap" | "pr";

interface BadgeProps {
  variant: BadgeVariant;
  label: string;
}

export function Badge({ variant, label }: BadgeProps) {
  return (
    <View style={[styles.base, variantStyles[variant]]}>
      <Text style={[styles.text, variantTextStyles[variant]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});

const variantStyles = StyleSheet.create({
  default: { backgroundColor: colors.surface },
  completed: { backgroundColor: colors.primary },
  today: { backgroundColor: colors.primary },
  planned: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  amrap: { backgroundColor: colors.primary },
  pr: { backgroundColor: colors.accent },
});

const variantTextStyles = StyleSheet.create({
  default: { color: colors.text },
  completed: { color: colors.primaryForeground },
  today: { color: colors.primaryForeground },
  planned: { color: colors.textSecondary },
  amrap: { color: colors.primaryForeground },
  pr: { color: colors.accentForeground },
});
