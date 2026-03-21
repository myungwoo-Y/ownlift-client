import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, borderRadius, colors, spacing } from "../design";

const TAB_BAR_HORIZONTAL_MARGIN = spacing.xl;
const TAB_BAR_BOTTOM_MARGIN = spacing.lg;
const TAB_BAR_VERTICAL_PADDING = spacing.sm;
const TAB_BAR_ITEM_HEIGHT = 58;

export function getFloatingTabBarScreenPadding(bottomInset: number): number {
  return bottomInset + TAB_BAR_ITEM_HEIGHT + TAB_BAR_VERTICAL_PADDING * 2 + TAB_BAR_BOTTOM_MARGIN + spacing["2xl"];
}

function FrostedShell({ children }: { children: React.ReactNode }) {
  const canUseNativeGlass = Platform.OS === "ios" && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

  return (
    <View style={styles.shell}>
      {canUseNativeGlass ? (
        <GlassView
          glassEffectStyle="regular"
          style={StyleSheet.absoluteFill}
          tintColor="rgba(255, 255, 255, 0.08)"
        />
      ) : (
        <BlurView
          intensity={Platform.OS === "ios" ? 90 : 24}
          tint={Platform.OS === "ios" ? "systemChromeMaterialDark" : "dark"}
          experimentalBlurMethod={Platform.OS === "android" ? "none" : undefined}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View pointerEvents="none" style={styles.shellTint} />
      <View pointerEvents="none" style={styles.shellShine} />
      <View style={styles.shellContent}>{children}</View>
    </View>
  );
}

export function FitnessTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

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
      <FrostedShell>
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          const isFocused = state.index === index;
          const label =
            typeof descriptor.options.tabBarLabel === "string"
              ? descriptor.options.tabBarLabel
              : descriptor.options.title ?? route.name;
          const activeColor = colors.primary;
          const inactiveColor = colors.textSecondary;
          const tintColor = isFocused ? activeColor : inactiveColor;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (event.defaultPrevented || isFocused) {
              return;
            }

            void Haptics.selectionAsync().catch(() => undefined);
            navigation.navigate(route.name, route.params);
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          const icon = descriptor.options.tabBarIcon?.({
            focused: isFocused,
            color: tintColor,
            size: 24,
          });

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={descriptor.options.tabBarAccessibilityLabel}
              testID={descriptor.options.tabBarButtonTestID}
              onLongPress={onLongPress}
              onPress={onPress}
              style={({ pressed }) => [
                styles.item,
                isFocused && styles.itemFocused,
                pressed && styles.itemPressed,
              ]}
            >
              <View style={[styles.iconPlate, isFocused && styles.iconPlateFocused]}>
                {icon}
              </View>
              <Text style={[styles.label, isFocused && styles.labelFocused]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
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
  shell: {
    overflow: "hidden",
    borderRadius: 30,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: colors.surfaceGlass,
    boxShadow: "0px 24px 80px rgba(0, 0, 0, 0.5)",
  },
  shellTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5, 8, 13, 0.2)",
  },
  shellShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
  },
  shellContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: TAB_BAR_VERTICAL_PADDING,
    gap: spacing.xs,
  },
  item: {
    flex: 1,
    minHeight: TAB_BAR_ITEM_HEIGHT,
    borderRadius: 24,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: spacing.md,
  },
  itemFocused: {
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    boxShadow: "0px 10px 28px rgba(0, 0, 0, 0.28)",
  },
  itemPressed: {
    opacity: 0.85,
  },
  iconPlate: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  iconPlateFocused: {
    backgroundColor: colors.primarySoft,
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
