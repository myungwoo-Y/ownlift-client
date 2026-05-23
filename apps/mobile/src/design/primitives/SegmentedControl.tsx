import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { borderRadius, colors, fontSize, fontWeight, motion, spacing } from "../tokens";
import { Text } from "./Text";

interface SegmentedControlProps {
  options: readonly string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  size?: "default" | "large";
}

export function SegmentedControl({
  options,
  selectedIndex,
  onSelect,
  size = "default",
}: SegmentedControlProps) {
  const [controlWidth, setControlWidth] = useState(0);
  const indicatorTranslateX = useSharedValue(0);
  const hasPositionedIndicatorRef = useRef(false);
  const controlPadding = size === "large" ? spacing.xs : spacing["2xs"];
  const selectedIndexSafe = Math.min(Math.max(selectedIndex, 0), options.length - 1);
  const segmentWidth = controlWidth > 0 && options.length > 0
    ? (controlWidth - controlPadding * 2) / options.length
    : 0;
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorTranslateX.value }],
  }));

  useEffect(() => {
    if (segmentWidth <= 0) return;

    const nextTranslateX = selectedIndexSafe * segmentWidth;

    if (!hasPositionedIndicatorRef.current) {
      indicatorTranslateX.value = nextTranslateX;
      hasPositionedIndicatorRef.current = true;
      return;
    }

    indicatorTranslateX.value = withTiming(nextTranslateX, {
      duration: motion.duration.normal,
    });
  }, [indicatorTranslateX, selectedIndexSafe, segmentWidth]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth !== controlWidth) {
      setControlWidth(nextWidth);
    }
  };

  return (
    <View
      onLayout={handleLayout}
      style={[styles.container, size === "large" && styles.containerLarge]}
    >
      {segmentWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.selectedIndicator,
            {
              bottom: controlPadding,
              left: controlPadding,
              top: controlPadding,
              width: segmentWidth,
            },
            indicatorStyle,
          ]}
        />
      ) : null}
      {options.map((option, index) => (
        <Pressable
          key={option}
          style={({ pressed }) => [
            styles.segment,
            size === "large" && styles.segmentLarge,
            pressed && styles.segmentPressed,
          ]}
          onPress={() => onSelect(index)}
        >
          <Text
            style={[
              styles.text,
              size === "large" && styles.textLarge,
              index === selectedIndex && styles.textSelected,
            ]}
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
    overflow: "hidden",
  },
  containerLarge: {
    padding: spacing.xs,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderRadius: borderRadius.lg,
    borderCurve: "continuous",
    zIndex: 1,
  },
  segmentLarge: {
    minHeight: spacing["4xl"] + spacing.xs,
    justifyContent: "center",
  },
  segmentPressed: {
    opacity: 0.78,
    transform: [{ scale: motion.scale.press }],
  },
  selectedIndicator: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: borderRadius.lg,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    boxShadow: "0px 10px 24px rgba(0, 0, 0, 0.2)",
  },
  text: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  textLarge: {
    fontSize: fontSize.lg,
  },
  textSelected: {
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
});
