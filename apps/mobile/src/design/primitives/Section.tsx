import { StyleSheet, View } from "react-native";
import { spacing } from "../tokens";
import { Text } from "./Text";

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.container}>
      <Text variant="sectionHeader">{title}</Text>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  content: {
    gap: spacing.md,
  },
});
