import type { SessionStubRecord } from "@ownlift/db";
import { Image } from "expo-image";
import { Pressable, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Badge, Card, Text } from "../../design";
import { getLiftLabel, t, useLocale } from "../../i18n";
import { styles } from "./styles";
import { getLiftThumbnailSource } from "./utils";

type PanGesture = ReturnType<typeof Gesture.Pan>;

interface WeekRowCardProps {
  stub: SessionStubRecord;
  isToday: boolean;
  isCompleted: boolean;
  isDragging: boolean;
  isAnyDragging: boolean;
  scheduledDayLabel?: string | null;
  summaryText?: string | null;
  gesture?: PanGesture;
  showDragHandle?: boolean;
  onPress?: (stub: SessionStubRecord) => void;
}

export function WeekRowCard({
  stub,
  isToday,
  isCompleted,
  isDragging,
  isAnyDragging,
  scheduledDayLabel,
  summaryText,
  gesture,
  showDragHandle = true,
  onPress,
}: WeekRowCardProps) {
  useLocale();

  const thumbnailSource = getLiftThumbnailSource(stub.mainLiftKey);

  const content = (
    <Card highlighted={isToday}>
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          {thumbnailSource ? (
            <View style={styles.thumbnailFrame}>
              <Image
                source={thumbnailSource}
                contentFit="contain"
                style={styles.thumbnailImage}
              />
            </View>
          ) : null}
          <View style={styles.cardText}>
            <Text style={styles.liftName}>
              {getLiftLabel(stub.mainLiftKey)}
            </Text>
            {(summaryText || scheduledDayLabel) ? (
              <View style={styles.metaRow}>
                {summaryText ? (
                  <Text
                    variant="caption"
                    numberOfLines={1}
                    style={styles.cardMetaText}
                  >
                    {summaryText}
                  </Text>
                ) : null}
                {scheduledDayLabel ? (
                  <Badge variant="planned" label={scheduledDayLabel} />
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.cardRight}>
          {showDragHandle ? (
            gesture ? (
              <GestureDetector gesture={gesture}>
                <View
                  accessibilityLabel={t("plan.reorderHandleA11y")}
                  style={[
                    styles.dragHandle,
                    styles.dragHandleRight,
                    isDragging && styles.dragHandleActive,
                  ]}
                >
                  <Text style={styles.dragHandleText}>≡</Text>
                </View>
              </GestureDetector>
            ) : (
              <View
                style={[
                  styles.dragHandle,
                  styles.dragHandleRight,
                  isDragging && styles.dragHandleActive,
                ]}
              >
                <Text style={styles.dragHandleText}>≡</Text>
              </View>
            )
          ) : null}
          <Badge
            variant={isCompleted ? "completed" : isToday ? "today" : "planned"}
            label={
              isCompleted
                ? t("status.completed")
                : isToday
                  ? t("status.today")
                  : t("status.planned")
            }
          />
        </View>
      </View>
    </Card>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      disabled={isAnyDragging && !isDragging}
      onPress={() => {
        if (isAnyDragging) return;
        onPress(stub);
      }}
    >
      {content}
    </Pressable>
  );
}
