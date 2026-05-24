import type { ReactNode } from "react";
import { StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from "react-native-svg";
import { colors, spacing } from "../tokens";
import { BackButton } from "./BackButton";

export const FLOATING_NAV_FADE_HEIGHT = spacing["5xl"] + spacing["4xl"];
export const FLOATING_NAV_CONTENT_TOP_OFFSET = spacing["5xl"] + spacing["2xl"];

interface FloatingBackNavProps {
  accessibilityLabel?: string;
  children?: ReactNode;
  disabled?: boolean;
  includeTopInset?: boolean;
  onPress: PressableProps["onPress"];
  style?: StyleProp<ViewStyle>;
}

export function FloatingBackNav({
  accessibilityLabel = "Back",
  children,
  disabled,
  includeTopInset = true,
  onPress,
  style,
}: FloatingBackNavProps) {
  const insets = useSafeAreaInsets();
  const topInset = includeTopInset ? insets.top : 0;

  return (
    <View style={[styles.navBar, style]} pointerEvents="box-none">
      <View
        pointerEvents="none"
        style={[styles.navBackdrop, { height: topInset + FLOATING_NAV_FADE_HEIGHT }]}
      >
        <Svg
          width="100%"
          height="100%"
          style={StyleSheet.absoluteFill}
          preserveAspectRatio="none"
        >
          <Defs>
            <SvgLinearGradient id="floatingNavFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={colors.background} stopOpacity="0.96" />
              <Stop offset="64%" stopColor={colors.background} stopOpacity="0.74" />
              <Stop offset="100%" stopColor={colors.background} stopOpacity="0" />
            </SvgLinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#floatingNavFade)" />
        </Svg>
      </View>
      <View style={[styles.navContent, { paddingTop: topInset + spacing.sm }]}>
        <BackButton
          onPress={onPress}
          disabled={disabled}
          accessibilityLabel={accessibilityLabel}
          style={styles.navBackButton}
        />
        {children ? <View style={styles.navAccessory}>{children}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  navBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: FLOATING_NAV_FADE_HEIGHT,
  },
  navContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  navBackButton: {
    marginLeft: 0,
  },
  navAccessory: {
    flex: 1,
  },
});
