import { Pressable, StyleSheet, View } from "react-native";
import { borderRadius, colors, fontSize, fontWeight, spacing } from "../tokens";
import { Text } from "./Text";

interface SegmentedControlProps {
  options: readonly string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function SegmentedControl({ options, selectedIndex, onSelect }: SegmentedControlProps) {
  return (
    <View style={styles.container}>
      {options.map((option, index) => (
        <Pressable
          key={option}
          style={[styles.segment, index === selectedIndex && styles.segmentSelected]}
          onPress={() => onSelect(index)}
        >
          <Text
            style={[styles.text, index === selectedIndex && styles.textSelected]}
          >
            {option}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.surfaceGlass,
    borderRadius: borderRadius.xl,
    borderCurve: "continuous",
    padding: spacing["2xs"],
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderRadius: borderRadius.lg,
    borderCurve: "continuous",
  },
  segmentSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    boxShadow: "0px 10px 24px rgba(0, 0, 0, 0.2)",
  },
  text: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  textSelected: {
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
});
