import { Ionicons } from "@expo/vector-icons";
import type { SessionStubRecord } from "@ownlift/db";
import type { PrescriptionData } from "@ownlift/schemas";
import { Image } from "expo-image";
import { Pressable, View } from "react-native";
import { Card, Text, colors } from "../../design";
import { formatNumber, getLiftLabel, getSessionLabel, t, useLocale } from "../../i18n";
import { styles } from "./styles";
import { getLiftThumbnailSource } from "./utils";

interface PlanTodayPreviewCardProps {
  stub: SessionStubRecord;
  prescription: PrescriptionData;
  scheduledDayLabel?: string | null;
  unit: string;
  onStart: () => void;
}

export function PlanTodayPreviewCard({
  stub,
  prescription,
  scheduledDayLabel,
  unit,
  onStart,
}: PlanTodayPreviewCardProps) {
  useLocale();

  const thumbnailSource = getLiftThumbnailSource(stub.mainLiftKey);
  const workSets = prescription.sets.filter((setData) => !setData.isWarmup);
  const sessionLabel = t("session.weekAndSession", {
    week: stub.weekIndex + 1,
    session: getSessionLabel(stub.dayIndex),
  });
  const subtitle = scheduledDayLabel
    ? `${scheduledDayLabel} · ${sessionLabel}`
    : sessionLabel;

  return (
    <Card highlighted style={styles.todayPreviewCard}>
      <View style={styles.todayPreviewHeader}>
        {thumbnailSource ? (
          <View style={styles.todayPreviewImageFrame}>
            <Image
              source={thumbnailSource}
              contentFit="contain"
              tintColor={colors.primary}
              style={styles.todayPreviewImage}
            />
          </View>
        ) : null}
        <View style={styles.todayPreviewCopy}>
          <Text style={styles.todayPreviewTitle}>
            {getLiftLabel(stub.mainLiftKey)}
          </Text>
          <Text style={styles.todayPreviewSubtitle}>{subtitle}</Text>
        </View>
      </View>

      <View style={styles.todayPreviewSetGrid}>
        {workSets.map((setData) => (
          <View
            key={setData.setOrder}
            style={[
              styles.todayPreviewSetCard,
              setData.isAmrap ? styles.todayPreviewSetCardAccent : null,
            ]}
          >
            <Text
              style={[
                styles.todayPreviewSetWeight,
                setData.isAmrap ? styles.todayPreviewSetWeightAccent : null,
              ]}
            >
              {formatNumber(setData.targetWeight)}
              <Text style={styles.todayPreviewSetUnit}> {unit}</Text>
            </Text>
            <Text
              style={[
                styles.todayPreviewSetReps,
                setData.isAmrap ? styles.todayPreviewSetRepsAccent : null,
              ]}
            >
              × {formatNumber(setData.targetReps)}
              {setData.isAmrap ? "+" : ""}
            </Text>
          </View>
        ))}
      </View>


      <Pressable
        accessibilityRole="button"
        onPress={onStart}
        style={({ pressed }) => [
          styles.todayPreviewCta,
          pressed ? styles.todayPreviewCtaPressed : null,
        ]}
      >
        <Text style={styles.todayPreviewCtaText}>{t("workout.startWorkout")}</Text>
        <Ionicons name="arrow-forward" size={22} color={colors.primaryForeground} />
      </Pressable>
    </Card>
  );
}
