import Ionicons from "@expo/vector-icons/Ionicons";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { DynamicColorIOS, Platform } from "react-native";
import { colors } from "../../src/design/tokens";
import { t, useLocale } from "../../src/i18n";

const defaultTabColor = Platform.OS === "ios"
  ? DynamicColorIOS({
    light: "rgba(17, 17, 17, 0.72)",
    dark: "rgba(255, 255, 255, 0.78)",
  })
  : colors.textSecondary;

const selectedTabColor = colors.primary;

const iosTabNativeProps = Platform.OS === "ios"
  ? {
    experimental_userInterfaceStyle: "dark" as const,
    standardAppearance: {
      tabBarBackgroundColor: colors.surface,
      tabBarBlurEffect: "none" as const,
      tabBarShadowColor: colors.border,
    },
    scrollEdgeAppearance: {
      tabBarBackgroundColor: colors.surface,
      tabBarBlurEffect: "none" as const,
      tabBarShadowColor: colors.border,
    },
  }
  : undefined;

const nativeTabsHostProps = {
  nativeContainerStyle: {
    backgroundColor: colors.background,
  },
};

export default function TabLayout() {
  useLocale();

  return (
    <NativeTabs
      {...nativeTabsHostProps}
      backBehavior="history"
      backgroundColor={colors.surface}
      blurEffect="none"
      disableTransparentOnScrollEdge
      indicatorColor={colors.primary}
      shadowColor={colors.border}
      tintColor={colors.primary}
      iconColor={{
        default: defaultTabColor,
        selected: selectedTabColor,
      }}
      labelStyle={{
        default: {
          fontSize: 11,
          fontWeight: "600",
        },
        selected: {
          color: selectedTabColor,
          fontSize: 11,
          fontWeight: "700",
        },
      }}
    >
      <NativeTabs.Trigger
        name="plan"
        contentStyle={{ backgroundColor: colors.background }}
        disableTransparentOnScrollEdge
        unstable_nativeProps={iosTabNativeProps}
      >
        <NativeTabs.Trigger.Icon
          sf={{ default: "calendar", selected: "calendar.circle.fill" }}
          src={{
            default: <NativeTabs.Trigger.VectorIcon family={Ionicons} name="calendar-outline" />,
            selected: <NativeTabs.Trigger.VectorIcon family={Ionicons} name="calendar" />,
          }}
        />
        <NativeTabs.Trigger.Label>{t("tab.plan")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="history"
        contentStyle={{ backgroundColor: colors.background }}
        disableTransparentOnScrollEdge
        unstable_nativeProps={iosTabNativeProps}
      >
        <NativeTabs.Trigger.Icon
          sf={{ default: "clock", selected: "clock.fill" }}
          src={{
            default: <NativeTabs.Trigger.VectorIcon family={Ionicons} name="time-outline" />,
            selected: <NativeTabs.Trigger.VectorIcon family={Ionicons} name="time" />,
          }}
        />
        <NativeTabs.Trigger.Label>{t("tab.history")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="settings"
        contentStyle={{ backgroundColor: colors.background }}
        disableTransparentOnScrollEdge
        unstable_nativeProps={iosTabNativeProps}
      >
        <NativeTabs.Trigger.Icon
          sf={{ default: "gearshape", selected: "gearshape.fill" }}
          src={{
            default: <NativeTabs.Trigger.VectorIcon family={Ionicons} name="settings-outline" />,
            selected: <NativeTabs.Trigger.VectorIcon family={Ionicons} name="settings" />,
          }}
        />
        <NativeTabs.Trigger.Label>{t("tab.settings")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
