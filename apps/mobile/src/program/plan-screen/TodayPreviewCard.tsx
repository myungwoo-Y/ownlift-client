import { Ionicons } from "@expo/vector-icons";
import type { SessionStubRecord } from "@ownlift/db";
import type { PrescriptionData } from "@ownlift/schemas";
import { Pressable, View } from "react-native";
import { Text, colors } from "../../design";
import { formatNumber, getLiftLabel, getSessionLabel, t, useLocale } from "../../i18n";
import { styles } from "./styles";

interface PlanTodayPreviewCardProps {
  stub: SessionStubRecord;
  prescription: PrescriptionData;
  scheduledDayLabel?: string | null;
  onStart: () => void;
}

export function PlanTodayPreviewCard({
  stub,
  prescription,
  scheduledDayLabel,
  onStart,
}: PlanTodayPreviewCardProps) {
  useLocale();

  const workSets = prescription.sets.filter((setData) => !setData.isWarmup);
  const sessionLabel = t("session.weekAndSession", {
    week: stub.weekIndex + 1,
    session: getSessionLabel(stub.dayIndex),
  });
  const subtitle = scheduledDayLabel
    ? `${scheduledDayLabel} · ${sessionLabel}`
    : sessionLabel;
  const workSetSummary = workSets
    .map((setData) => {
      const repsLabel = `${formatNumber(setData.targetReps)}${setData.isAmrap ? "+" : ""}`;
      return `${formatNumber(setData.targetWeight)}×${repsLabel}`;
    })
    .join(" · ");

  return (
    <Pressable
      accessibilityLabel={`${getLiftLabel(stub.mainLiftKey)} ${t("workout.startWorkout")}`}
      accessibilityRole="button"
      onPress={onStart}
      style={({ pressed }) => [
        styles.todayPreviewCard,
        pressed ? styles.todayPreviewCardPressed : null,
      ]}
    >
      <View style={styles.todayPreviewBackground} />
      <View style={styles.todayPreviewContent}>
        <View style={styles.todayPreviewCopy}>
          <Text numberOfLines={1} style={styles.todayPreviewMeta}>
            {subtitle}
          </Text>
          <Text numberOfLines={1} style={styles.todayPreviewTitle}>
            {getLiftLabel(stub.mainLiftKey)}
          </Text>
          <Text numberOfLines={2} style={styles.todayPreviewSummary}>
            {workSetSummary}
          </Text>
        </View>
      </View>
      <View style={styles.todayPreviewPlayButton}>
        <Ionicons name="play" size={18} color={colors.primaryForeground} />
      </View>
    </Pressable>
  );
}
