import type { SessionStubRecord } from "@ownlift/db";
import { Image } from "expo-image";
import { Pressable, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Badge, Card, Text } from "../../design";
import { getLiftLabel, getSessionLabel, t } from "../../i18n";
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
  gesture,
  showDragHandle = true,
  onPress,
}: WeekRowCardProps) {
  const thumbnailSource = getLiftThumbnailSource(stub.mainLiftKey);
  const sessionMeta = t("session.weekAndSession", {
    week: stub.weekIndex + 1,
    session: getSessionLabel(stub.dayIndex),
  });

  const content = (
    <Card highlighted={isToday}>
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          {thumbnailSource ? (
            <View style={styles.thumbnailFrame}>
              <Image
                source={thumbnailSource}
                contentFit="cover"
                style={styles.thumbnailImage}
              />
            </View>
          ) : null}
          <View style={styles.cardText}>
            <Text style={styles.liftName}>
              {getLiftLabel(stub.mainLiftKey)}
            </Text>
            <View style={styles.metaRow}>
              <Text variant="caption">{sessionMeta}</Text>
              {scheduledDayLabel ? (
                <Badge variant="planned" label={scheduledDayLabel} />
              ) : null}
            </View>
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
