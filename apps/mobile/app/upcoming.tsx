import type { SessionStubRecord } from "@ownlift/db";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BackButton, Badge, Card, colors, Section, spacing, Text, borderRadius } from "../src/design";
import { getLiftLabel, getSessionLabel, getWeekdayShortLabel, t, useLocale } from "../src/i18n";
import { getScheduledDayForIndex } from "../src/program/schedule-policy";
import { useProgramStore } from "../src/stores/program-store";

const squatThumbnailSource = require("../assets/images/squat.png");
const benchThumbnailSource = require("../assets/images/bench-press.png");
const deadliftThumbnailSource = require("../assets/images/deadlift.png");
const pressThumbnailSource = require("../assets/images/ohp.png");

function getLiftThumbnailSource(mainLiftKey: SessionStubRecord["mainLiftKey"]) {
  if (mainLiftKey === "squat") return squatThumbnailSource;
  if (mainLiftKey === "bench") return benchThumbnailSource;
  if (mainLiftKey === "deadlift") return deadliftThumbnailSource;
  if (mainLiftKey === "press") return pressThumbnailSource;
  return null;
}

function UpcomingSessionCard({
  stub,
  scheduledDayLabel,
  onPress,
}: {
  stub: SessionStubRecord;
  scheduledDayLabel?: string | null;
  onPress: (stub: SessionStubRecord) => void;
}) {
  const thumbnailSource = getLiftThumbnailSource(stub.mainLiftKey);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(stub)}
    >
      <Card>
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
              <Text style={styles.liftName}>{getLiftLabel(stub.mainLiftKey)}</Text>
              <View style={styles.metaRow}>
                <Text variant="caption">
                  {t("session.weekAndSession", {
                    week: stub.weekIndex + 1,
                    session: getSessionLabel(stub.dayIndex),
                  })}
                </Text>
                {scheduledDayLabel ? <Badge variant="planned" label={scheduledDayLabel} /> : null}
              </View>
            </View>
          </View>

          <View style={styles.cardRight}>
            <Badge variant="planned" label={t("status.planned")} />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export default function UpcomingScreen() {
  useLocale();

  const router = useRouter();
  const { instance, stubs, isLoading, loadProgram } = useProgramStore();

  useFocusEffect(
    useCallback(() => {
      void loadProgram();
    }, [loadProgram]),
  );

  const goBack = useCallback(() => {
    try {
      if (router.canGoBack()) {
        router.back();
        return;
      }

      if (router.canDismiss()) {
        router.dismiss();
        return;
      }

      router.dismissTo("/(tabs)");
    } catch {
      try {
        router.dismissTo("/(tabs)");
      } catch {
        try {
          router.replace("/(tabs)");
        } catch {
        }
      }
    }
  }, [router]);

  if (isLoading || !instance) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text variant="body">{t("plan.loadingProgram")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const upcomingStubs = stubs.filter(
    (stub) => stub.cycleIndex === instance.state.currentCycle && stub.weekIndex > instance.state.currentWeek,
  );
  const upcomingWeeks = upcomingStubs.reduce<Array<{ weekIndex: number; stubs: SessionStubRecord[] }>>((groups, stub) => {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.weekIndex === stub.weekIndex) {
      lastGroup.stubs.push(stub);
      return groups;
    }

    groups.push({ weekIndex: stub.weekIndex, stubs: [stub] });
    return groups;
  }, []);

  const getScheduledDayLabel = (dayIndex: number): string | null => {
    if (instance.params.scheduleMode !== "scheduled") {
      return null;
    }

    const scheduledDay = getScheduledDayForIndex(dayIndex, instance.params.scheduledDays);
    return scheduledDay ? getWeekdayShortLabel(scheduledDay) : null;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <BackButton
        onPress={goBack}
        accessibilityLabel={t("common.back")}
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>{t("tab.plan")}</Text>
          <Text style={styles.headerTitle}>{t("plan.section.upcoming")}</Text>
        </View>

        {upcomingWeeks.length > 0 ? (
          <View style={styles.upcomingGroups}>
            {upcomingWeeks.map((weekGroup) => (
              <Section
                key={weekGroup.weekIndex}
                title={t("week.title", { week: weekGroup.weekIndex + 1 })}
              >
                <View style={styles.weekList}>
                  {weekGroup.stubs.map((stub) => (
                    <UpcomingSessionCard
                      key={stub.sessionId}
                      stub={stub}
                      scheduledDayLabel={getScheduledDayLabel(stub.dayIndex)}
                      onPress={(pressedStub) => {
                        router.push(`/workout/${pressedStub.sessionId}`);
                      }}
                    />
                  ))}
                </View>
              </Section>
            ))}
          </View>
        ) : (
          <Card>
            <Text variant="body">{t("plan.preview.emptyTitle")}</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    padding: spacing["2xl"],
    paddingBottom: spacing["4xl"],
    gap: spacing["2xl"],
  },
  header: {
    gap: spacing.xs,
  },
  headerEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.textTertiary,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.text,
  },
  upcomingGroups: {
    gap: spacing["2xl"],
  },
  weekList: {
    gap: spacing.md,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  cardLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 0,
  },
  thumbnailFrame: {
    width: 82,
    height: 82,
    borderRadius: 22,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: colors.surfaceMuted,
    flexShrink: 0,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  liftName: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
});
