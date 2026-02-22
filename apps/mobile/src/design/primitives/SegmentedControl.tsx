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
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing["2xs"],
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderRadius: borderRadius.sm,
  },
  segmentSelected: {
    backgroundColor: colors.surfaceElevated,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
