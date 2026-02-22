import { getWeekLabel } from "@ownlift/core";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { Badge, Button, Card, colors, Divider, Section, spacing, Text } from "../../src/design";
import { useProgramStore } from "../../src/stores/program-store";

const LIFT_DISPLAY: Record<string, string> = {
  squat: "Squat",
  bench: "Bench Press",
  deadlift: "Deadlift",
  press: "Press",
};

export default function PlanScreen() {
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
          <Text variant="body">Loading program...</Text>
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
            <Text variant="title">Week {String(state.currentWeek + 1)}</Text>
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
        <Section title="THIS WEEK">
          {currentWeekStubs.map((stub, index) => {
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
                      <Text style={styles.todayLabelText}>Today</Text>
                    </View>
                  )}
                  <View style={styles.cardContent}>
                    <View style={styles.cardLeft}>
                      <Text variant="caption">
                        Session {String.fromCharCode(65 + index)}
                      </Text>
                      <Text style={styles.liftName}>
                        {LIFT_DISPLAY[stub.mainLiftKey] ?? stub.mainLiftKey}
                      </Text>
                      <Text variant="caption">531 + assistance</Text>
                    </View>
                    <Badge
                      variant={isCompleted ? "completed" : isToday ? "today" : "planned"}
                      label={isCompleted ? "Completed" : isToday ? "Today" : "Planned"}
                    />
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </Section>

        {/* Upcoming */}
        {state.currentWeek < 3 && (
          <Section title="UPCOMING">
            <Card>
              <View style={styles.upcomingRow}>
                <View>
                  <Text style={styles.upcomingTitle}>
                    Week {String(state.currentWeek + 2)}
                  </Text>
                  <Text variant="caption">
                    {LIFT_DISPLAY[instance.params.liftOrder[0] ?? ""] ?? ""} and more
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
              title="Start Today Workout"
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
