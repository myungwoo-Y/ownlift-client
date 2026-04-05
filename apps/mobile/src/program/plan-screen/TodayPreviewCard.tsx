import type { SessionStubRecord } from "@ownlift/db";
import type { PrescriptionData } from "@ownlift/schemas";
import { Image } from "expo-image";
import { View } from "react-native";
import { Badge, Button, Card, Text } from "../../design";
import { getLiftLabel, getSessionLabel, t, useLocale } from "../../i18n";
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
  const warmupCount = prescription.sets.filter((setData) => setData.isWarmup).length;
  const workSets = prescription.sets.filter((setData) => !setData.isWarmup);
  const hasAmrap = workSets.some((setData) => setData.isAmrap);

  return (
    <Card highlighted style={styles.todayPreviewCard}>
      <View style={styles.todayPreviewHeader}>
        <View style={styles.todayPreviewCopy}>
          <Text variant="label">{t("plan.section.today")}</Text>
          <Text style={styles.todayPreviewTitle}>
            {getLiftLabel(stub.mainLiftKey)}
          </Text>
          <Text variant="caption">
            {t("session.weekAndSession", {
              week: stub.weekIndex + 1,
              session: getSessionLabel(stub.dayIndex),
            })}
          </Text>
        </View>
        {thumbnailSource ? (
          <View style={styles.todayPreviewImageFrame}>
            <Image
              source={thumbnailSource}
              contentFit="contain"
              style={styles.todayPreviewImage}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.todayPreviewMeta}>
        {scheduledDayLabel ? <Badge variant="planned" label={scheduledDayLabel} /> : null}
        {hasAmrap ? <Badge variant="amrap" label={t("badge.amrap")} /> : null}
        <Badge
          variant="planned"
          label={t("plan.preview.totalSets", { count: prescription.sets.length })}
        />
        {warmupCount > 0 ? (
          <Badge
            variant="planned"
            label={t("plan.preview.warmupSets", { count: warmupCount })}
          />
        ) : null}
      </View>

      <View style={styles.todayPreviewSets}>
        <Text style={styles.todayPreviewSetsLabel}>
          {t("plan.preview.workSets")}
        </Text>
        <View style={styles.workSetList}>
          {workSets.map((setData) => (
            <View key={setData.setOrder} style={styles.workSetChip}>
              <Text style={styles.workSetChipWeight}>
                {String(setData.targetWeight)}
                {unit}
              </Text>
              <Text variant="caption">
                × {String(setData.targetReps)}
                {setData.isAmrap ? "+" : ""}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Button title={t("plan.startTodayWorkout")} onPress={onStart} />
    </Card>
  );
}
