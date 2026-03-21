import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { GlassContainer, GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import { Platform, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, borderRadius, colors, spacing } from "../design";

const TAB_BAR_HORIZONTAL_MARGIN = spacing.xl;
const TAB_BAR_BOTTOM_MARGIN = spacing.lg;
const TAB_BAR_VERTICAL_PADDING = spacing.sm;
const TAB_BAR_ITEM_HEIGHT = 58;
const TAB_BAR_ITEM_GAP = spacing.xs;
const TAB_PILL_SPRING = {
  damping: 20,
  stiffness: 220,
  mass: 0.9,
};
const TOUCH_LENS_SIZE = 132;
const TOUCH_LENS_TOP_OFFSET = -28;

export function getFloatingTabBarScreenPadding(bottomInset: number): number {
  return bottomInset + TAB_BAR_ITEM_HEIGHT + TAB_BAR_VERTICAL_PADDING * 2 + TAB_BAR_BOTTOM_MARGIN + spacing["2xl"];
}

function FrostedShell({
  children,
  isTouchInteracting,
  touchLensStyle,
}: {
  children: React.ReactNode;
  isTouchInteracting: boolean;
  touchLensStyle: any;
}) {
  const canUseNativeGlass = Platform.OS === "ios" && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

  return (
    <View style={styles.shellFrame}>
      {canUseNativeGlass ? (
        <GlassContainer spacing={0} style={styles.shellFrame}>
          <View style={styles.shell}>
            <View pointerEvents="none" style={styles.shellTint} />
            <View pointerEvents="none" style={styles.shellShine} />
            <View style={styles.shellContent}>{children}</View>
          </View>
          {isTouchInteracting ? (
            <Animated.View pointerEvents="none" style={[styles.touchLensFrame, touchLensStyle]}>
              <GlassView
                glassEffectStyle="clear"
                isInteractive
                style={styles.touchLens}
                tintColor="rgba(255, 255, 255, 0.001)"
              />
            </Animated.View>
          ) : null}
        </GlassContainer>
      ) : (
        <View style={styles.shell}>
          {Platform.OS === "ios" ? (
            <BlurView
              intensity={40}
              tint="systemChromeMaterialDark"
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View pointerEvents="none" style={styles.shellFallbackLayer} />
          )}
          <View pointerEvents="none" style={styles.shellTint} />
          <View pointerEvents="none" style={styles.shellShine} />
          <View style={styles.shellContent}>{children}</View>
        </View>
      )}
    </View>
  );
}

export function FitnessTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [contentWidth, setContentWidth] = useState(0);
  const [interactionIndex, setInteractionIndex] = useState<number | null>(null);
  const [isTouchInteracting, setIsTouchInteracting] = useState(false);
  const interactionIndexRef = useRef<number | null>(null);
  const activeOffset = useSharedValue(0);
  const touchLensOffset = useSharedValue(0);
  const itemWidth =
    contentWidth > 0
      ? (contentWidth - TAB_BAR_ITEM_GAP * (state.routes.length - 1)) / state.routes.length
      : 0;
  const displayIndex = isTouchInteracting && interactionIndex !== null ? interactionIndex : state.index;

  const getIndexForX = useCallback((x: number): number => {
    if (itemWidth <= 0) {
      return state.index;
    }

    const step = itemWidth + TAB_BAR_ITEM_GAP;
    const clamped = Math.max(0, Math.min(x, contentWidth));
    return Math.max(0, Math.min(Math.floor(clamped / step), state.routes.length - 1));
  }, [contentWidth, itemWidth, state.index, state.routes.length]);

  const navigateToIndex = useCallback((index: number) => {
    const route = state.routes[index];
    if (!route || index === state.index) {
      return;
    }

    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (event.defaultPrevented) {
      return;
    }

    void Haptics.selectionAsync().catch(() => undefined);
    navigation.navigate(route.name, route.params);
  }, [navigation, state.index, state.routes]);

  const updateInteractionIndex = useCallback((nextIndex: number) => {
    if (interactionIndexRef.current === nextIndex) {
      return;
    }

    interactionIndexRef.current = nextIndex;
    setInteractionIndex(nextIndex);
    void Haptics.selectionAsync().catch(() => undefined);
  }, []);

  const handleTouchStart = useCallback((x: number) => {
    const nextIndex = getIndexForX(x);
    setIsTouchInteracting(true);
    updateInteractionIndex(nextIndex);
  }, [getIndexForX, updateInteractionIndex]);

  const handleTouchMove = useCallback((x: number) => {
    const nextIndex = getIndexForX(x);
    updateInteractionIndex(nextIndex);
  }, [getIndexForX, updateInteractionIndex]);

  const handleTouchEnd = useCallback(() => {
    const nextIndex = interactionIndexRef.current;
    setIsTouchInteracting(false);
    setInteractionIndex(null);
    interactionIndexRef.current = null;

    if (nextIndex === null) {
      return;
    }

    navigateToIndex(nextIndex);
  }, [navigateToIndex]);

  useEffect(() => {
    if (itemWidth <= 0) {
      activeOffset.value = 0;
      touchLensOffset.value = 0;
      return;
    }

    activeOffset.value = withSpring(
      displayIndex * (itemWidth + TAB_BAR_ITEM_GAP),
      TAB_PILL_SPRING,
    );
    touchLensOffset.value = withSpring(
      displayIndex * (itemWidth + TAB_BAR_ITEM_GAP) + itemWidth / 2 - TOUCH_LENS_SIZE / 2,
      TAB_PILL_SPRING,
    );
  }, [activeOffset, displayIndex, itemWidth, touchLensOffset]);

  const activePillStyle = useAnimatedStyle(() => ({
    opacity: itemWidth > 0 ? 1 : 0,
    width: itemWidth,
    transform: [{ translateX: activeOffset.value }],
  }));

  const touchLensStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: touchLensOffset.value }],
  }));

  const tabBarGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin((event) => {
          runOnJS(handleTouchStart)(event.x);
        })
        .onUpdate((event) => {
          runOnJS(handleTouchMove)(event.x);
        })
        .onFinalize(() => {
          runOnJS(handleTouchEnd)();
        }),
    [handleTouchEnd, handleTouchMove, handleTouchStart],
  );

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.outer,
        {
          bottom: insets.bottom + TAB_BAR_BOTTOM_MARGIN,
        },
      ]}
    >
      <FrostedShell isTouchInteracting={isTouchInteracting} touchLensStyle={touchLensStyle}>
        <GestureDetector gesture={tabBarGesture}>
          <View style={styles.shellContent}>
            <View
              onLayout={(event) => {
                setContentWidth(event.nativeEvent.layout.width);
              }}
              style={styles.itemRow}
            >
              <Animated.View pointerEvents="none" style={[styles.activePill, activePillStyle]} />
              {state.routes.map((route, index) => {
                const descriptor = descriptors[route.key];
                const isFocused = displayIndex === index;
                const isSelected = state.index === index;
                const label =
                  typeof descriptor.options.tabBarLabel === "string"
                    ? descriptor.options.tabBarLabel
                    : descriptor.options.title ?? route.name;
                const activeColor = colors.primary;
                const inactiveColor = colors.textSecondary;
                const tintColor = isFocused ? activeColor : inactiveColor;

                const icon = descriptor.options.tabBarIcon?.({
                  focused: isFocused,
                  color: tintColor,
                  size: 24,
                });

                return (
                  <View
                    key={route.key}
                    accessible
                    accessibilityRole="button"
                    accessibilityState={isSelected ? { selected: true } : {}}
                    accessibilityLabel={descriptor.options.tabBarAccessibilityLabel ?? label}
                    onAccessibilityTap={() => navigateToIndex(index)}
                    onMagicTap={() => navigateToIndex(index)}
                    style={styles.item}
                    testID={descriptor.options.tabBarButtonTestID}
                  >
                    <View style={[styles.iconPlate, isFocused && styles.iconPlateFocused]}>
                      {icon}
                    </View>
                    <Text style={[styles.label, isFocused && styles.labelFocused]}>
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </GestureDetector>
      </FrostedShell>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: "absolute",
    left: TAB_BAR_HORIZONTAL_MARGIN,
    right: TAB_BAR_HORIZONTAL_MARGIN,
  },
  shellFrame: {
    position: "relative",
    overflow: "visible",
  },
  shell: {
    overflow: "hidden",
    borderRadius: 30,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(28, 28, 30, 0.68)",
    boxShadow: "0px 24px 72px rgba(0, 0, 0, 0.42)",
  },
  shellFallbackLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(28, 28, 30, 0.72)",
  },
  shellTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.04)",
  },
  shellShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  shellContent: {
    padding: TAB_BAR_VERTICAL_PADDING,
  },
  itemRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    gap: TAB_BAR_ITEM_GAP,
  },
  activePill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 24,
    borderCurve: "continuous",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
    boxShadow: "0px 10px 24px rgba(0, 0, 0, 0.18)",
  },
  touchLensFrame: {
    position: "absolute",
    top: TOUCH_LENS_TOP_OFFSET,
    width: TOUCH_LENS_SIZE,
    height: TOUCH_LENS_SIZE,
    borderRadius: TOUCH_LENS_SIZE / 2,
    borderCurve: "continuous",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    boxShadow: "0px 12px 30px rgba(0, 0, 0, 0.18)",
  },
  touchLens: {
    width: "100%",
    height: "100%",
    borderRadius: TOUCH_LENS_SIZE / 2,
    borderCurve: "continuous",
    backgroundColor: "transparent",
  },
  item: {
    zIndex: 1,
    flex: 1,
    minHeight: TAB_BAR_ITEM_HEIGHT,
    borderRadius: 24,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: spacing.md,
  },
  iconPlate: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  iconPlateFocused: {
    backgroundColor: "transparent",
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  labelFocused: {
    color: colors.primary,
  },
});
