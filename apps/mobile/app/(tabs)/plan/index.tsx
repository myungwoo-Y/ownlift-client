import { Ionicons } from "@expo/vector-icons";
import type { PrescriptionData } from "@ownlift/schemas";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Card, Section, Text, colors } from "../../../src/design";
import { getSessionLabel, t, useLocale } from "../../../src/i18n";
import { TAB_BAR_SCROLL_INDICATOR_INSETS } from "../../../src/program/plan-screen/constants";
import { PlanActivitySummaryCards } from "../../../src/program/plan-screen/PlanActivitySummaryCards";
import { PlanWeekCarousel } from "../../../src/program/plan-screen/PlanWeekCarousel";
import { styles } from "../../../src/program/plan-screen/styles";
import { PlanTodayPreviewCard } from "../../../src/program/plan-screen/TodayPreviewCard";
import { PlanUpcomingWeekCard } from "../../../src/program/plan-screen/UpcomingWeekCard";
import { usePlanActivitySummary } from "../../../src/program/plan-screen/usePlanActivitySummary";
import { useWeekPrescriptionSummaries } from "../../../src/program/plan-screen/useWeekPrescriptionSummaries";
import { loadSyncedPrescriptionForSession } from "../../../src/program/prescription-sync";
import { useProgramStore } from "../../../src/stores/program-store";

export default function PlanScreen() {
  useLocale();

  const router = useRouter();
  const { instance, currentWeekStubs, stubs, todayStub, isLoading, loadProgram } =
    useProgramStore();
  const [todayPreview, setTodayPreview] = useState<PrescriptionData | null>(null);
  const [isTodayPreviewLoading, setIsTodayPreviewLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      void loadProgram();
    }, [loadProgram]),
  );

  useEffect(() => {
    let cancelled = false;

    async function loadTodayPreview() {
      if (!instance || !todayStub) {
        setTodayPreview(null);
        setIsTodayPreviewLoading(false);
        return;
      }

      try {
        setIsTodayPreviewLoading(true);
        const stub = stubs.find((item) => item.sessionId === todayStub.sessionId);
        const rx = await loadSyncedPrescriptionForSession({
          sessionId: todayStub.sessionId,
          instance,
          stub,
        });
        if (cancelled) {
          return;
        }
        setTodayPreview(rx?.data ?? null);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load today preview", error);
          setTodayPreview(null);
        }
      } finally {
        if (!cancelled) {
          setIsTodayPreviewLoading(false);
        }
      }
    }

    void loadTodayPreview();

    return () => {
      cancelled = true;
    };
  }, [instance, stubs, todayStub]);

  const unit = instance?.params.unit ?? "";
  const weekSummaryBySessionId = useWeekPrescriptionSummaries({
    instance,
    weekStubs: currentWeekStubs,
    unit,
  });
  const activitySummary = usePlanActivitySummary({
    instance,
    currentWeekStubs,
    stubs,
  });

  if (isLoading || !instance) {
    return (
      <View style={styles.safe}>
        <View style={styles.center}>
          <Text variant="body">{t("plan.loadingProgram")}</Text>
        </View>
      </View>
    );
  }

  const { state } = instance;
  const todayPreviewSessionLabel = todayStub
    ? t("session.weekAndSession", {
        week: todayStub.weekIndex + 1,
        session: getSessionLabel(todayStub.dayIndex),
      })
    : null;
  const upcomingStubs = stubs.filter(
    (stub) => stub.cycleIndex === state.currentCycle && stub.weekIndex > state.currentWeek,
  );
  const nextUpcomingStub = upcomingStubs[0] ?? null;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.container}
      scrollIndicatorInsets={TAB_BAR_SCROLL_INDICATOR_INSETS}
      showsVerticalScrollIndicator={false}
      style={styles.safe}
    >
      <Section title={t("plan.section.today")} titleStyle={styles.sectionTitle}>
        {todayStub && todayPreview ? (
          <>
            {todayPreviewSessionLabel ? (
              <Text style={styles.todayPreviewSectionSubtitle}>
                {todayPreviewSessionLabel}
              </Text>
            ) : null}
            <PlanTodayPreviewCard
              stub={todayStub}
              prescription={todayPreview}
              onStart={() => router.push(`/workout/${todayStub.sessionId}?autostart=1`)}
            />
          </>
        ) : (
          <Card>
            <View style={styles.todayEmptyState}>
              <Text style={styles.todayEmptyTitle}>
                {isTodayPreviewLoading ? t("plan.loadingProgram") : t("plan.preview.emptyTitle")}
              </Text>
              {!isTodayPreviewLoading ? (
                <Text variant="caption">{t("plan.preview.emptySubtitle")}</Text>
              ) : null}
            </View>
          </Card>
        )}
      </Section>

      <Section
        title={t("plan.section.thisWeek")}
        titleStyle={styles.sectionTitle}
        headerAccessory={(
          <Pressable
            accessibilityLabel={t("plan.editWeek")}
            accessibilityRole="button"
            onPress={() => router.push("/(tabs)/plan/reorder")}
            style={({ pressed }) => [
              styles.sectionIconButton,
              pressed ? styles.sectionIconButtonPressed : null,
            ]}
          >
            <Ionicons name="create-outline" size={18} color={colors.text} />
          </Pressable>
        )}
      >
        <PlanWeekCarousel
          weekStubs={currentWeekStubs}
          sessionSummaryBySessionId={weekSummaryBySessionId}
          todaySessionId={todayStub?.sessionId}
          onPressStub={(pressedStub) => {
            if (pressedStub.status === "completed") {
              router.push(`/session/${pressedStub.sessionId}`);
              return;
            }

            if (pressedStub.sessionId === todayStub?.sessionId) {
              router.push(`/workout/${pressedStub.sessionId}?autostart=1`);
              return;
            }

            router.push(`/workout/${pressedStub.sessionId}`);
          }}
        />
      </Section>

      <Section title={t("plan.section.activity")} titleStyle={styles.sectionTitle}>
        <PlanActivitySummaryCards summary={activitySummary} />
      </Section>

      {nextUpcomingStub ? (
        <Section title={t("plan.section.upcoming")} titleStyle={styles.sectionTitle}>
          <PlanUpcomingWeekCard
            onPress={() => {
              router.push("/upcoming");
            }}
          />
        </Section>
      ) : null}
    </ScrollView>
  );
}
