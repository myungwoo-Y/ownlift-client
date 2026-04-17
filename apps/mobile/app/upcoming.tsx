import type { PrescriptionData } from "@ownlift/schemas";
import type { SessionStubRecord } from "@ownlift/db";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BackButton, Badge, Card, colors, Section, spacing, Text } from "../src/design";
import { formatNumber, getLiftLabel, getWeekdayShortLabel, t, useLocale } from "../src/i18n";
import { loadSyncedPrescriptionForSession } from "../src/program/prescription-sync";
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

function getTopSetSummary(
  prescription: PrescriptionData | null | undefined,
  unit: string,
): string | null {
  const topSet = prescription?.sets.filter((setData) => !setData.isWarmup).at(-1);
  if (!topSet) {
    return null;
  }

  return `${formatNumber(topSet.targetWeight)}${unit} × ${formatNumber(topSet.targetReps)}${topSet.isAmrap ? "+" : ""}`;
}

function UpcomingSessionCard({
  stub,
  scheduledDayLabel,
  summaryText,
  onPress,
}: {
  stub: SessionStubRecord;
  scheduledDayLabel?: string | null;
  summaryText?: string | null;
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
                  contentFit="contain"
                  style={styles.thumbnailImage}
                />
              </View>
            ) : null}
            <View style={styles.cardText}>
              <Text style={styles.liftName}>{getLiftLabel(stub.mainLiftKey)}</Text>
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
                  {scheduledDayLabel ? <Badge variant="planned" label={scheduledDayLabel} /> : null}
                </View>
              ) : null}
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
  const [upcomingPrescriptions, setUpcomingPrescriptions] = useState<Record<string, PrescriptionData | null>>({});

  useFocusEffect(
    useCallback(() => {
      void loadProgram();
    }, [loadProgram]),
  );

  useEffect(() => {
    let cancelled = false;

    async function loadUpcomingPrescriptions() {
      if (!instance) {
        setUpcomingPrescriptions({});
        return;
      }

      const targetStubs = stubs.filter(
        (stub) => stub.cycleIndex === instance.state.currentCycle && stub.weekIndex > instance.state.currentWeek,
      );

      if (targetStubs.length === 0) {
        setUpcomingPrescriptions({});
        return;
      }

      const results = await Promise.allSettled(
        targetStubs.map(async (stub) => {
          const rx = await loadSyncedPrescriptionForSession({
            sessionId: stub.sessionId,
            instance,
            stub,
          });

          return [stub.sessionId, rx?.data ?? null] as const;
        }),
      );

      if (cancelled) return;

      const nextPrescriptions: Record<string, PrescriptionData | null> = {};
      for (const result of results) {
        if (result.status === "fulfilled") {
          const [sessionId, prescription] = result.value;
          nextPrescriptions[sessionId] = prescription;
          continue;
        }

        console.error("Failed to load upcoming prescription", result.reason);
      }

      setUpcomingPrescriptions(nextPrescriptions);
    }

    void loadUpcomingPrescriptions();

    return () => {
      cancelled = true;
    };
  }, [instance, stubs]);

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

      router.dismissTo("/(tabs)/plan");
    } catch {
      try {
        router.dismissTo("/(tabs)/plan");
      } catch {
        try {
          router.replace("/(tabs)/plan");
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
  const unit = instance.params.unit;
  const upcomingWeeks = upcomingStubs.reduce<{ weekIndex: number; stubs: SessionStubRecord[] }[]>((groups, stub) => {
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
                      summaryText={getTopSetSummary(upcomingPrescriptions[stub.sessionId], unit)}
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
  cardMetaText: {
    flexShrink: 1,
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
    width: 68,
    height: 68,
    borderRadius: 18,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: colors.surfaceMuted,
    padding: spacing.xs,
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
