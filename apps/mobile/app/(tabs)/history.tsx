import { calcE1RM } from "@ownlift/core";
import type { SessionStubRecord, SetLogRecord } from "@ownlift/db";
import { getSetLogsBySession, getWorkoutResultBySession } from "@ownlift/db";
import type { MainLift } from "@ownlift/schemas";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge, Card, SegmentedControl, borderRadius, colors, fontSize, fontWeight, spacing, Text } from "../../src/design";
import { formatDate as formatLocaleDate, formatNumber, getLiftLabel, getSessionLabel, getWeekLabel, t, useLocale } from "../../src/i18n";
import { useProgramStore } from "../../src/stores/program-store";

type HistoryLiftFilter = "all" | MainLift;

interface HistoryItem extends SessionStubRecord {
  completedAt?: string;
  totalVolume?: number;
  estimatedOneRepMax?: number | null;
}

interface TrendPoint {
  sessionId: string;
  completedAt: string;
  label: string;
  value: number;
}

interface WeeklyWorkoutCount {
  key: string;
  label: string;
  count: number;
  isCurrentWeek: boolean;
}

const HISTORY_FILTERS: readonly HistoryLiftFilter[] = [
  "all",
  "squat",
  "bench",
  "deadlift",
  "press",
];
const MAX_TREND_POINTS = 6;
const MIN_TREND_POINTS = 2;
const MIN_WEEKLY_WORKOUTS = 2;
const LINE_CHART_HEIGHT = 152;
const BAR_TRACK_HEIGHT = 92;

function formatHistoryDate(dateStr: string | null): { day: string; weekday: string } {
  if (!dateStr) return { day: "", weekday: "" };
  const d = new Date(dateStr);
  const day = formatLocaleDate(d, { month: "short", day: "numeric" });
  const weekday = formatLocaleDate(d, { weekday: "long" });
  return { day, weekday };
}

function getHistoryFilterLabel(filter: HistoryLiftFilter): string {
  if (filter === "all") return t("history.filter.all");
  if (filter === "squat") return t("history.filter.squat");
  if (filter === "bench") return t("history.filter.bench");
  if (filter === "deadlift") return t("history.filter.deadlift");
  return t("history.filter.press");
}

function getCompletedSetMetrics(log: SetLogRecord): { weight: number; reps: number } | null {
  if (!log.isCompleted) return null;
  if (log.setType !== "work" && log.setType !== "amrap") return null;

  const weight = log.actualWeight ?? log.planned?.targetWeight ?? null;
  const reps = log.actualReps ?? log.planned?.targetReps ?? null;

  if (weight == null || reps == null || weight <= 0 || reps <= 0) {
    return null;
  }

  return { weight, reps };
}

function getSessionEstimatedOneRepMax(logs: SetLogRecord[]): number | null {
  const workLogs = logs.filter((log) => log.setType === "work" || log.setType === "amrap");
  const amrapLogs = workLogs.filter((log) => log.setType === "amrap");
  const sourceLogs = amrapLogs.length > 0 ? amrapLogs : workLogs;

  let bestEstimate: number | null = null;

  for (const log of sourceLogs) {
    const metrics = getCompletedSetMetrics(log);
    if (!metrics) continue;

    const estimate = calcE1RM(metrics);
    if (bestEstimate == null || estimate > bestEstimate) {
      bestEstimate = estimate;
    }
  }

  return bestEstimate;
}

function getWeekStart(date: Date): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  const day = value.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + diff);
  return value;
}

function addDays(date: Date, days: number): Date {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function getRelativeWeekLabel(offset: number): string {
  if (offset === 0) return t("history.weekLabel.this");
  if (offset === 1) return t("history.weekLabel.last");
  return t("history.weekLabel.weeksAgo", { count: offset });
}

function buildTrendPoints(items: HistoryItem[], lift: MainLift): TrendPoint[] {
  return items
    .filter((item) => item.mainLiftKey === lift && item.completedAt && item.estimatedOneRepMax != null)
    .sort((a, b) => (a.completedAt ?? "").localeCompare(b.completedAt ?? ""))
    .slice(-MAX_TREND_POINTS)
    .map((item) => ({
      sessionId: item.sessionId,
      completedAt: item.completedAt ?? "",
      label: formatLocaleDate(item.completedAt ?? "", { month: "numeric", day: "numeric" }),
      value: item.estimatedOneRepMax ?? 0,
    }));
}

function buildWeeklyWorkoutCounts(items: HistoryItem[]): WeeklyWorkoutCount[] {
  const currentWeekStart = getWeekStart(new Date());
  const weekStarts = Array.from({ length: 4 }, (_, index) => addDays(currentWeekStart, (index - 3) * 7));
  const counts = new Map(weekStarts.map((start) => [start.toISOString(), 0]));

  for (const item of items) {
    if (!item.completedAt) continue;
    const weekStart = getWeekStart(new Date(item.completedAt)).toISOString();
    if (!counts.has(weekStart)) continue;
    counts.set(weekStart, (counts.get(weekStart) ?? 0) + 1);
  }

  return weekStarts.map((weekStart, index) => {
    const offset = weekStarts.length - index - 1;
    return {
      key: weekStart.toISOString(),
      label: getRelativeWeekLabel(offset),
      count: counts.get(weekStart.toISOString()) ?? 0,
      isCurrentWeek: offset === 0,
    };
  });
}

function formatMeasurement(value: number, unit: string): string {
  return `${formatNumber(value, { maximumFractionDigits: 1 })} ${unit}`;
}

function ChartEmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.chartEmpty}>
      <Text style={styles.chartEmptyTitle}>{title}</Text>
      <Text variant="caption" style={styles.chartEmptySubtitle}>
        {subtitle}
      </Text>
    </View>
  );
}

function MetricPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metricPill}>
      <Text variant="label">{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function LiftTrendChart({
  points,
}: {
  points: TrendPoint[];
}) {
  const [chartWidth, setChartWidth] = useState(0);

  const values = points.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const spread = maxValue - minValue;
  const padding = spread === 0 ? Math.max(maxValue * 0.05, 2) : spread * 0.18;
  const chartMin = Math.max(0, minValue - padding);
  const chartMax = maxValue + padding;
  const chartRange = Math.max(chartMax - chartMin, 1);
  const horizontalPadding = spacing.sm;
  const verticalPadding = spacing.md;
  const usableWidth = Math.max(chartWidth - horizontalPadding * 2, 0);
  const usableHeight = LINE_CHART_HEIGHT - verticalPadding * 2;

  const positionedPoints = points.map((point, index) => {
    const x = points.length === 1
      ? chartWidth / 2
      : horizontalPadding + (usableWidth * index) / (points.length - 1);
    const y = verticalPadding + usableHeight * (1 - (point.value - chartMin) / chartRange);

    return {
      ...point,
      x,
      y,
      isLatest: index === points.length - 1,
    };
  });

  return (
    <View style={styles.trendChart}>
      <View
        style={styles.trendPlot}
        onLayout={(event: LayoutChangeEvent) => {
          const nextWidth = event.nativeEvent.layout.width;
          if (nextWidth !== chartWidth) {
            setChartWidth(nextWidth);
          }
        }}
      >
        {[0, 0.5, 1].map((ratio) => (
          <View
            key={String(ratio)}
            style={[
              styles.trendGridline,
              { top: ratio * (LINE_CHART_HEIGHT - 1) },
            ]}
          />
        ))}

        <View style={[styles.trendAxisValue, styles.trendAxisValueTop]}>
          <Text variant="caption">{formatNumber(maxValue, { maximumFractionDigits: 1 })}</Text>
        </View>
        <View style={[styles.trendAxisValue, styles.trendAxisValueBottom]}>
          <Text variant="caption">{formatNumber(minValue, { maximumFractionDigits: 1 })}</Text>
        </View>

        {positionedPoints.slice(0, -1).map((point, index) => {
          const nextPoint = positionedPoints[index + 1];
          const deltaX = nextPoint.x - point.x;
          const deltaY = nextPoint.y - point.y;
          const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
          const angle = Math.atan2(deltaY, deltaX);

          return (
            <View
              key={`${point.sessionId}-${nextPoint.sessionId}`}
              style={[
                styles.trendSegment,
                {
                  left: point.x,
                  top: point.y - 1,
                  width: distance,
                  transform: [{ rotateZ: `${angle}rad` }],
                  transformOrigin: "left center",
                },
              ]}
            />
          );
        })}

        {positionedPoints.map((point) => {
          const pointSize = point.isLatest ? 14 : 10;
          return (
            <View
              key={point.sessionId}
              style={[
                styles.trendPoint,
                point.isLatest && styles.trendPointLatest,
                {
                  left: point.x - pointSize / 2,
                  top: point.y - pointSize / 2,
                  width: pointSize,
                  height: pointSize,
                  borderRadius: pointSize / 2,
                },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.trendAxisLabels}>
        <Text variant="caption">{points[0]?.label}</Text>
        <Text variant="caption">{points[points.length - 1]?.label}</Text>
      </View>
    </View>
  );
}

function LiftTrendCard({
  selectedLift,
  items,
  unit,
}: {
  selectedLift: HistoryLiftFilter;
  items: HistoryItem[];
  unit: string;
}) {
  const latestCompleted = items[0];
  const trendPoints = selectedLift === "all" ? [] : buildTrendPoints(items, selectedLift);
  const latestPoint = trendPoints[trendPoints.length - 1];

  return (
    <Card style={styles.chartCard}>
      <View style={styles.chartCardHeader}>
        <View style={styles.chartCardCopy}>
          <Text style={styles.chartTitle}>
            {selectedLift === "all"
              ? t("history.allLiftTrendTitle")
              : t("history.e1rmTitle", { lift: getLiftLabel(selectedLift) })}
          </Text>
          <Text variant="caption">
            {selectedLift === "all"
              ? t("history.allLiftTrendHelper")
              : t("history.e1rmHelper")}
          </Text>
        </View>
        {latestPoint ? (
          <MetricPill
            label={t("history.latestE1rm")}
            value={formatMeasurement(latestPoint.value, unit)}
          />
        ) : null}
      </View>

      {selectedLift === "all" ? (
        items.length === 0 ? (
          <ChartEmptyState
            title={t("history.e1rmEmptyTitle")}
            subtitle={t("history.e1rmEmptySubtitle")}
          />
        ) : (
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryMessage}>
              {t("history.allLiftTrendPlaceholder")}
            </Text>

            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text variant="label">{t("history.completedWorkouts")}</Text>
                <Text style={styles.summaryStatValue}>{formatNumber(items.length)}</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text variant="label">{t("history.latestWorkout")}</Text>
                <Text style={styles.summaryStatValue}>
                  {latestCompleted ? getLiftLabel(latestCompleted.mainLiftKey) : "—"}
                </Text>
                {latestCompleted?.completedAt ? (
                  <Text variant="caption">
                    {formatLocaleDate(latestCompleted.completedAt, {
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        )
      ) : trendPoints.length < MIN_TREND_POINTS ? (
        <ChartEmptyState
          title={t("history.e1rmEmptyTitle")}
          subtitle={t("history.e1rmEmptySubtitle")}
        />
      ) : (
        <LiftTrendChart points={trendPoints} />
      )}
    </Card>
  );
}

function WeeklyWorkoutChart({
  weeks,
}: {
  weeks: WeeklyWorkoutCount[];
}) {
  const maxCount = Math.max(...weeks.map((week) => week.count), 1);

  return (
    <View style={styles.barChart}>
      {weeks.map((week) => {
        const ratio = week.count / maxCount;
        const height = week.count === 0 ? 0 : Math.max(ratio * BAR_TRACK_HEIGHT, 12);

        return (
          <View key={week.key} style={styles.barColumn}>
            <Text style={styles.barValue}>{formatNumber(week.count)}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  week.isCurrentWeek && styles.barFillCurrent,
                  { height },
                ]}
              />
            </View>
            <Text style={styles.barLabel}>{week.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function WeeklyWorkoutCard({
  items,
}: {
  items: HistoryItem[];
}) {
  const weeks = buildWeeklyWorkoutCounts(items);
  const totalWorkouts = weeks.reduce((sum, week) => sum + week.count, 0);

  return (
    <Card style={styles.chartCard}>
      <View style={styles.chartCardHeader}>
        <View style={styles.chartCardCopy}>
          <Text style={styles.chartTitle}>{t("history.weeklyWorkoutTitle")}</Text>
          <Text variant="caption">{t("history.weeklyWorkoutHelper")}</Text>
        </View>
        {totalWorkouts > 0 ? (
          <MetricPill
            label={t("history.last4Weeks")}
            value={formatNumber(totalWorkouts)}
          />
        ) : null}
      </View>

      {items.length < MIN_WEEKLY_WORKOUTS ? (
        <ChartEmptyState
          title={t("history.weeklyWorkoutEmptyTitle")}
          subtitle={t("history.weeklyWorkoutEmptySubtitle")}
        />
      ) : (
        <WeeklyWorkoutChart weeks={weeks} />
      )}
    </Card>
  );
}

export default function HistoryScreen() {
  useLocale();

  const router = useRouter();
  const { stubs, instance } = useProgramStore();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [selectedLift, setSelectedLift] = useState<HistoryLiftFilter>("bench");

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function load() {
        const completedStubs = stubs.filter((stub) => stub.status === "completed");

        const enriched = await Promise.all(
          completedStubs.map(async (stub) => {
            const [result, logs] = await Promise.all([
              getWorkoutResultBySession(stub.sessionId),
              getSetLogsBySession(stub.sessionId),
            ]);

            return {
              ...stub,
              completedAt: result?.completedAt,
              totalVolume: result?.summary?.totalVolume ?? undefined,
              estimatedOneRepMax: getSessionEstimatedOneRepMax(logs),
            } satisfies HistoryItem;
          }),
        );

        enriched.sort((a, b) =>
          (b.completedAt ?? b.scheduledDate ?? "").localeCompare(a.completedAt ?? a.scheduledDate ?? ""),
        );

        if (isActive) {
          setItems(enriched);
        }
      }

      void load();

      return () => {
        isActive = false;
      };
    }, [stubs]),
  );

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const { day, weekday } = formatHistoryDate(item.completedAt ?? null);
    const weekLabel = getWeekLabel(item.weekIndex);
    const sessionLabel = getSessionLabel(item.dayIndex);

    return (
      <Pressable onPress={() => router.push(`/session/${item.sessionId}`)}>
        <Card style={styles.historyCard}>
          <View style={styles.historyItem}>
            <View style={styles.dateColumn}>
              <Text style={styles.dateDay}>{day}</Text>
              <Text variant="caption">{weekday}</Text>
            </View>
            <View style={styles.detailColumn}>
              <View style={styles.titleRow}>
                <Text style={styles.liftName}>
                  {getLiftLabel(item.mainLiftKey)}
                </Text>
                <View style={styles.badges}>
                  <Badge variant="completed" label={t("status.completed")} />
                </View>
              </View>
              <Text variant="caption">
                {sessionLabel} · {t("week.title", { week: item.weekIndex + 1 })} · {weekLabel}
              </Text>
              {item.totalVolume != null ? (
                <Text variant="caption">
                  {t("history.volume", {
                    volume: formatNumber(item.totalVolume),
                    unit: instance?.params.unit ?? "kg",
                  })}
                </Text>
              ) : null}
            </View>
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.sessionId}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={(
          <View style={styles.listHeader}>
            <View style={styles.header}>
              <Text style={styles.headerEyebrow}>{t("tab.history")}</Text>
              <Text variant="title">{t("history.title")}</Text>
            </View>

            <View style={styles.chartSection}>
              <SegmentedControl
                options={HISTORY_FILTERS.map((filter) => getHistoryFilterLabel(filter))}
                selectedIndex={HISTORY_FILTERS.indexOf(selectedLift)}
                onSelect={(index) => {
                  const nextFilter = HISTORY_FILTERS[index];
                  if (!nextFilter) return;
                  setSelectedLift(nextFilter);
                }}
              />

              <LiftTrendCard
                selectedLift={selectedLift}
                items={items}
                unit={instance?.params.unit ?? "kg"}
              />

              <WeeklyWorkoutCard items={items} />

              <Text variant="sectionHeader">{t("history.logSectionTitle")}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.empty}>
            <Text variant="body" style={styles.emptyText}>
              {t("history.emptyTitle")}
            </Text>
            <Text variant="caption" style={styles.emptyText}>
              {t("history.emptySubtitle")}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing["2xl"],
    paddingBottom: spacing["4xl"],
    gap: spacing.md,
  },
  listHeader: {
    gap: spacing.lg,
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.sm,
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
  chartSection: {
    gap: spacing.md,
  },
  chartCard: {
    gap: spacing.lg,
  },
  chartCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  chartCardCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  chartTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  metricPill: {
    minWidth: 88,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.28)",
    backgroundColor: colors.primarySoft,
    gap: 2,
  },
  metricValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
  },
  chartEmpty: {
    minHeight: 148,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing["2xl"],
  },
  chartEmptyTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    textAlign: "center",
  },
  chartEmptySubtitle: {
    maxWidth: 260,
    textAlign: "center",
    lineHeight: 18,
  },
  trendChart: {
    gap: spacing.sm,
  },
  trendPlot: {
    height: LINE_CHART_HEIGHT,
    borderRadius: borderRadius.lg,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  trendGridline: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  trendAxisValue: {
    position: "absolute",
    right: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(0, 0, 0, 0.26)",
  },
  trendAxisValueTop: {
    top: spacing.xs,
  },
  trendAxisValueBottom: {
    bottom: spacing.xs,
  },
  trendSegment: {
    position: "absolute",
    height: 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent,
  },
  trendPoint: {
    position: "absolute",
    backgroundColor: colors.surfaceGlassStrong,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  trendPointLatest: {
    backgroundColor: colors.accent,
    borderColor: colors.background,
  },
  trendAxisLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xs,
  },
  summaryBlock: {
    gap: spacing.md,
  },
  summaryMessage: {
    fontSize: fontSize.md,
    lineHeight: 22,
    color: colors.text,
  },
  summaryStats: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  summaryStat: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderCurve: "continuous",
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  summaryStatValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  barChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    gap: spacing.sm,
  },
  barValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  barTrack: {
    width: "100%",
    height: BAR_TRACK_HEIGHT,
    justifyContent: "flex-end",
    borderRadius: borderRadius.lg,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  barFill: {
    width: "100%",
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(34, 197, 94, 0.28)",
  },
  barFillCurrent: {
    backgroundColor: colors.accent,
  },
  barLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textTertiary,
  },
  historyCard: {
    padding: spacing.lg,
  },
  historyItem: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  dateColumn: {
    width: 72,
    gap: 2,
  },
  dateDay: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
  },
  detailColumn: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  liftName: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  badges: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  empty: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing["3xl"],
  },
  emptyText: {
    textAlign: "center",
  },
});
