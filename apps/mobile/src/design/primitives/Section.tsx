import {
  StyleSheet,
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import { spacing } from "../tokens";
import { Text } from "./Text";

interface SectionProps {
  title: string;
  children: React.ReactNode;
  titleStyle?: StyleProp<TextStyle>;
  headerAccessory?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Section({
  title,
  children,
  titleStyle,
  headerAccessory,
  contentStyle,
}: SectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, titleStyle]} variant="sectionHeader">
          {title}
        </Text>
        {headerAccessory ? (
          <View style={styles.headerAccessory}>{headerAccessory}</View>
        ) : null}
      </View>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  title: {
    flex: 1,
  },
  headerAccessory: {
    flexShrink: 0,
  },
  content: {
    gap: spacing.md,
  },
});
