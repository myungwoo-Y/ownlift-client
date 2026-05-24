import { Text as RNText, type TextProps as RNTextProps, StyleSheet, type TextStyle, type StyleProp } from "react-native";
import { colors, fontSize, fontWeight } from "../tokens";

type TextVariant = "title" | "subtitle" | "body" | "caption" | "label" | "sectionHeader";

interface TextProps extends RNTextProps {
  variant?: TextVariant;
}

function getInterFontFamily(fontWeightVal?: string | number): string {
  const weight = String(fontWeightVal || "400");
  switch (weight) {
    case "100":
    case "200":
    case "300":
      return "Inter_400Regular";
    case "400":
    case "normal":
      return "Inter_400Regular";
    case "500":
    case "medium":
      return "Inter_500Medium";
    case "600":
    case "semibold":
      return "Inter_600SemiBold";
    case "700":
    case "bold":
      return "Inter_700Bold";
    case "800":
    case "900":
    case "extrabold":
      return "Inter_800ExtraBold";
    default:
      return "Inter_400Regular";
  }
}

export function resolveInterStyle(style?: StyleProp<TextStyle>): StyleProp<TextStyle> {
  if (!style) return style;

  const flatStyle = StyleSheet.flatten(style);
  if (!flatStyle) return style;

  const fontWeightVal = flatStyle.fontWeight;
  const fontFamily = getInterFontFamily(fontWeightVal);

  return [
    flatStyle,
    {
      fontFamily,
      fontWeight: undefined,
    },
  ];
}

export function Text({ variant = "body", style, ...rest }: TextProps) {
  const resolvedStyle = resolveInterStyle([styles.base, styles[variant], style]);
  return <RNText style={resolvedStyle} {...rest} />;
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
