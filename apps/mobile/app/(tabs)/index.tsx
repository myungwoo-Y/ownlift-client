import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge, Button, Card, colors, Divider, Section, spacing, Text } from "../../src/design";
import { getLiftLabel, getSessionLabel, getWeekLabel, t, useLocale } from "../../src/i18n";
import { useProgramStore } from "../../src/stores/program-store";

export default function PlanScreen() {
  useLocale();

  const router = useRouter();
  const { instance, currentWeekStubs, stubs, nextStub, isLoading, loadProgram } = useProgramStore();

  useFocusEffect(
    useCallback(() => {
      void loadProgram();
    }, [loadProgram]),
  );

  if (isLoading || !instance) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text variant="body">{t("plan.loadingProgram")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { state } = instance;
  const weekLabel = getWeekLabel(state.currentWeek);
  const completedCount = stubs.filter((s) => s.status === "completed").length;
  const totalCount = stubs.length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="title">{t("week.title", { week: state.currentWeek + 1 })}</Text>
            <Text variant="subtitle">{weekLabel}</Text>
          </View>
          <View style={styles.progressPill}>
            <Text style={styles.progressText}>
              {String(completedCount)}/{String(totalCount)}
            </Text>
          </View>
        </View>

        <Divider />

        {/* This Week */}
        <Section title={t("plan.section.thisWeek")}>
          {currentWeekStubs.map((stub) => {
            const isToday = nextStub?.sessionId === stub.sessionId;
            const isCompleted = stub.status === "completed";

            return (
              <Pressable
                key={stub.sessionId}
                onPress={() => {
                  if (isCompleted) {
                    router.push(`/session/${stub.sessionId}`);
                  }
                }}
              >
                <Card highlighted={isToday}>
                  {isToday && (
                    <View style={styles.todayLabel}>
                      <Text style={styles.todayLabelText}>{t("status.today")}</Text>
                    </View>
                  )}
                  <View style={styles.cardContent}>
                    <View style={styles.cardLeft}>
                      <Text variant="caption">
                        {getSessionLabel(stub.dayIndex)}
                      </Text>
                      <Text style={styles.liftName}>
                        {getLiftLabel(stub.mainLiftKey)}
                      </Text>
                      <Text variant="caption">{t("plan.assistance")}</Text>
                    </View>
                    <Badge
                      variant={isCompleted ? "completed" : isToday ? "today" : "planned"}
                      label={isCompleted ? t("status.completed") : isToday ? t("status.today") : t("status.planned")}
                    />
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </Section>

        {/* Upcoming */}
        {state.currentWeek < 3 && (
          <Section title={t("plan.section.upcoming")}>
            <Card>
              <View style={styles.upcomingRow}>
                <View>
                  <Text style={styles.upcomingTitle}>
                    {t("week.title", { week: state.currentWeek + 2 })}
                  </Text>
                  <Text variant="caption">
                    {t("plan.andMore", { lift: getLiftLabel(instance.params.liftOrder[0] ?? "") })}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
            </Card>
          </Section>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      {nextStub && (
        <View style={styles.ctaContainer}>
          <Divider />
          <View style={styles.ctaPadding}>
            <Button
              title={t("plan.startTodayWorkout")}
              onPress={() => router.push(`/workout/${nextStub.sessionId}`)}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing["2xl"],
    paddingBottom: 120,
    gap: spacing["2xl"],
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: spacing["2xl"],
  },
  progressPill: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  todayLabel: {
    position: "absolute",
    top: -10,
    left: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  todayLabelText: {
    color: colors.primaryForeground,
    fontSize: 11,
    fontWeight: "700",
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLeft: {
    flex: 1,
    gap: 2,
  },
  liftName: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  upcomingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  upcomingTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  chevron: {
    fontSize: 24,
    color: colors.textTertiary,
  },
  ctaContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    paddingBottom: spacing["3xl"],
  },
  ctaPadding: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.lg,
  },
});
