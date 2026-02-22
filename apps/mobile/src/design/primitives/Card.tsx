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
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  highlighted: {
    borderWidth: 2,
    borderColor: colors.borderStrong,
  },
});
