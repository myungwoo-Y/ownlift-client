import { Ionicons } from "@expo/vector-icons";
import type { SessionStubRecord } from "@ownlift/db";
import type { PrescriptionData } from "@ownlift/schemas";
import { Image } from "expo-image";
import { Pressable, View } from "react-native";
import { Text, colors } from "../../design";
import { formatNumber, getLiftLabel, t, useLocale } from "../../i18n";
import { styles } from "./styles";
import { getLiftThumbnailSource } from "./utils";

interface PlanTodayPreviewCardProps {
  stub: SessionStubRecord;
  prescription: PrescriptionData;
  onStart: () => void;
}

export function PlanTodayPreviewCard({
  stub,
  prescription,
  onStart,
}: PlanTodayPreviewCardProps) {
  useLocale();

  const thumbnailSource = getLiftThumbnailSource(stub.mainLiftKey);
  const workSets = prescription.sets.filter((setData) => !setData.isWarmup);

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
      <View style={styles.todayPreviewContent}>
        {thumbnailSource ? (
          <View>
            <Image
                source={thumbnailSource}
                contentFit="contain"
                style={styles.todayPreviewTitleIcon}
                tintColor={colors.primaryForeground}
              />
          </View>
        ) : null}
        <View style={styles.todayPreviewTitleRow}>
          <Text numberOfLines={1} style={styles.todayPreviewTitle}>
            {getLiftLabel(stub.mainLiftKey)}
          </Text>
        </View>
        <View style={styles.todayPreviewSummaryRow}>
          {workSets.map((setData, index) => (
            <View key={setData.setOrder} style={styles.todayPreviewSummaryGroup}>
              <View style={styles.todayPreviewSummaryItem}>
                <Text style={styles.todayPreviewSummaryWeight}>
                  {formatNumber(setData.targetWeight)}
                </Text>
                <Text style={styles.todayPreviewSummaryReps}>
                  × {formatNumber(setData.targetReps)}
                  {setData.isAmrap ? "+" : ""}
                </Text>
              </View>
              {index < workSets.length - 1 ? (
                <Text style={styles.todayPreviewSummarySeparator}>·</Text>
              ) : null}
            </View>
          ))}
        </View>
      </View>
      <View style={styles.todayPreviewPlayButton}>
        <Ionicons name="play" size={18} color={colors.primary} />
      </View>
    </Pressable>
  );
}
