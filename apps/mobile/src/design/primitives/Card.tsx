import { StyleSheet, View, type ViewProps } from "react-native";
import { borderRadius, colors, spacing } from "../tokens";

interface CardProps extends ViewProps {
  highlighted?: boolean;
}

export function Card({ highlighted, style, ...rest }: CardProps) {
  return (
    <View
      style={[
        styles.base,
        highlighted && styles.highlighted,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceGlassStrong,
    borderRadius: borderRadius.xl,
    borderCurve: "continuous",
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    boxShadow: "0px 18px 48px rgba(0, 0, 0, 0.24)",
  },
  highlighted: {
    backgroundColor: colors.surfaceElevated,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
});
