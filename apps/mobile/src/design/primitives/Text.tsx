import { Text as RNText, type TextProps as RNTextProps, StyleSheet } from "react-native";
import { colors, fontSize, fontWeight } from "../tokens";

type TextVariant = "title" | "subtitle" | "body" | "caption" | "label" | "sectionHeader";

interface TextProps extends RNTextProps {
  variant?: TextVariant;
}

export function Text({ variant = "body", style, ...rest }: TextProps) {
  return <RNText style={[styles.base, styles[variant], style]} {...rest} />;
}

const styles = StyleSheet.create({
  base: {
    color: colors.text,
  },
  title: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.extrabold,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  body: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.normal,
    color: colors.text,
  },
  caption: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    color: colors.textSecondary,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionHeader: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
