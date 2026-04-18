import { Ionicons } from "@expo/vector-icons";
import type { SessionStubRecord } from "@ownlift/db";
import type { PrescriptionData } from "@ownlift/schemas";
import { Image } from "expo-image";
import { Pressable, View } from "react-native";
import { Badge, Card, Text, colors } from "../../design";
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
  const workSetSummary = t("plan.preview.workSetCount", { count: workSets.length });

  return (
    <Card highlighted style={styles.todayPreviewCard}>
      <View style={styles.todayPreviewHeader}>
        <View style={styles.todayPreviewCopy}>
          <View style={styles.todayPreviewBadgeRow}>
            <Badge label={t("status.today")} variant="today" />
            <View style={styles.todayPreviewMetaPill}>
              <Text numberOfLines={1} style={styles.todayPreviewMetaPillText}>
                {subtitle}
              </Text>
            </View>
          </View>
          <Text style={styles.todayPreviewTitle}>
            {getLiftLabel(stub.mainLiftKey)}
          </Text>
          <Text style={styles.todayPreviewSubtitle}>{workSetSummary}</Text>
        </View>
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
      </View>

      <View style={styles.todayPreviewSetGrid}>
        {workSets.map((setData, index) => (
          <View
            key={setData.setOrder}
            style={[
              styles.todayPreviewSetCard,
              setData.isAmrap ? styles.todayPreviewSetCardAccent : null,
            ]}
          >
            <Text
              style={[
                styles.todayPreviewSetLabel,
                setData.isAmrap ? styles.todayPreviewSetLabelAccent : null,
              ]}
            >
              {setData.isAmrap ? t("badge.amrap") : t("workout.setLabel", { set: index + 1 })}
            </Text>
            <View style={styles.todayPreviewSetValueRow}>
              <Text
                style={[
                  styles.todayPreviewSetWeight,
                  setData.isAmrap ? styles.todayPreviewSetWeightAccent : null,
                ]}
              >
                {formatNumber(setData.targetWeight)}
              </Text>
              {unit ? (
                <Text style={styles.todayPreviewSetUnit}>{unit}</Text>
              ) : null}
            </View>
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
        <View style={styles.todayPreviewCtaIcon}>
          <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
        </View>
      </Pressable>
    </Card>
  );
}
