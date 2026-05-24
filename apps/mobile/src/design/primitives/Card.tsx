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
    boxShadow: "0px 20px 44px rgba(0, 0, 0, 0.26)",
  },
  highlighted: {
    backgroundColor: colors.surfaceElevated,
  },
});
