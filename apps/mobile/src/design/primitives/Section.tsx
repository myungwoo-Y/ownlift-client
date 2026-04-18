import { StyleSheet, type StyleProp, type TextStyle, View } from "react-native";
import { spacing } from "../tokens";
import { Text } from "./Text";

interface SectionProps {
  title: string;
  children: React.ReactNode;
  titleStyle?: StyleProp<TextStyle>;
}

export function Section({ title, children, titleStyle }: SectionProps) {
  return (
    <View style={styles.container}>
      <Text style={titleStyle} variant="sectionHeader">
        {title}
      </Text>
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
