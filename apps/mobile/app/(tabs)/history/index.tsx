import { calcE1RM } from "@ownlift/core";
import type { SessionStubRecord, SetLogRecord } from "@ownlift/db";
import { getSetLogsBySession, getWorkoutResultBySession } from "@ownlift/db";
import type { MainLift } from "@ownlift/schemas";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Badge, Card, borderRadius, colors, fontSize, fontWeight, spacing, Text } from "../../../src/design";
import { buildMockHistoryItems } from "../../../src/history/mock-history";
import { formatDate as formatLocaleDate, formatNumber, getLiftLabel, getSessionLabel, getWeekLabel, t, useLocale } from "../../../src/i18n";
import { useProgramStore } from "../../../src/stores/program-store";

interface HistoryItem extends SessionStubRecord {
  completedAt?: string;
  totalVolume?: number;
  estimatedOneRepMax?: number | null;
  isMock?: boolean;
}

interface TrendPoint {
  sessionId: string;
  completedAt: string;
  label: string;
  value: number;
}

interface LiftSummary {
  lift: MainLift;
  latestPoint: TrendPoint | null;
  previousPoint: TrendPoint | null;
  change: number | null;
}

const SUMMARY_LIFTS: readonly MainLift[] = [
  "deadlift",
  "squat",
  "bench",
  "press",
];
const MAX_TREND_POINTS = 8;
const MIN_TREND_POINTS = 2;
const LINE_CHART_HEIGHT = 152;

function formatHistoryDate(dateStr: string | null): { day: string; weekday: string } {
  if (!dateStr) return { day: "", weekday: "" };
  const d = new Date(dateStr);
  const day = formatLocaleDate(d, { month: "short", day: "numeric" });
  const weekday = formatLocaleDate(d, { weekday: "long" });
  return { day, weekday };
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

function buildTrendPoints(items: HistoryItem[], lift: MainLift, limit = MAX_TREND_POINTS): TrendPoint[] {
  const points = items
    .filter((item) => item.mainLiftKey === lift && item.completedAt && item.estimatedOneRepMax != null)
    .sort((a, b) => (a.completedAt ?? "").localeCompare(b.completedAt ?? ""))
    .map((item) => ({
      sessionId: item.sessionId,
      completedAt: item.completedAt ?? "",
      label: formatLocaleDate(item.completedAt ?? "", { month: "numeric", day: "numeric" }),
      value: item.estimatedOneRepMax ?? 0,
    }));

  return limit > 0 ? points.slice(-limit) : points;
}

function formatMeasurement(value: number, unit: string): string {
  return `${formatNumber(value, { maximumFractionDigits: 1 })} ${unit}`;
}

function formatChange(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${formatNumber(Math.abs(value), { maximumFractionDigits: 1 })}`;
}

function buildLiftSummary(items: HistoryItem[], lift: MainLift): LiftSummary {
  const points = buildTrendPoints(items, lift, 2);
  const latestPoint = points[points.length - 1] ?? null;
  const previousPoint = points[points.length - 2] ?? null;

  return {
    lift,
    latestPoint,
    previousPoint,
    change: latestPoint && previousPoint ? latestPoint.value - previousPoint.value : null,
  };
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

function LiftSummaryCards({
  items,
  selectedLift,
  unit,
  onSelect,
}: {
  items: HistoryItem[];
  selectedLift: MainLift;
  unit: string;
  onSelect: (lift: MainLift) => void;
}) {
  return (
    <View style={styles.summaryGrid}>
      {SUMMARY_LIFTS.map((lift) => {
        const summary = buildLiftSummary(items, lift);
        const isSelected = selectedLift === lift;
        const changeStyle = summary.change == null
          ? styles.summaryChangePlaceholder
          : summary.change > 0
            ? styles.summaryChangePositive
            : summary.change < 0
              ? styles.summaryChangeNegative
              : styles.summaryChangeNeutral;

        return (
          <Pressable
            key={lift}
            style={styles.summaryCardPressable}
            onPress={() => onSelect(lift)}
          >
            <Card style={[styles.summaryCard, isSelected && styles.summaryCardSelected]}>
              <View style={styles.summaryCardTop}>
                <Text
                  style={styles.summaryLiftLabel}
                  numberOfLines={2}
                >
                  {getLiftLabel(lift)}
                </Text>
                <View style={[styles.summaryActiveDot, isSelected && styles.summaryActiveDotSelected]} />
              </View>

              <Text
                style={styles.summaryLiftValue}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                numberOfLines={1}
              >
                {summary.latestPoint ? formatMeasurement(summary.latestPoint.value, unit) : "—"}
              </Text>

              <Text style={[styles.summaryLiftChange, changeStyle]}>
                {summary.change == null ? " " : formatChange(summary.change)}
              </Text>
            </Card>
          </Pressable>
        );
      })}
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
  selectedLift: MainLift;
  items: HistoryItem[];
  unit: string;
}) {
  const trendPoints = buildTrendPoints(items, selectedLift);
  const latestPoint = trendPoints[trendPoints.length - 1];
  const previousPoint = trendPoints[trendPoints.length - 2] ?? null;
  const change = latestPoint && previousPoint ? latestPoint.value - previousPoint.value : null;

  return (
    <Card style={styles.chartCard}>
      <View style={styles.chartCardHeader}>
        <View style={styles.chartCardCopy}>
          <Text style={styles.chartTitle}>
            {t("history.e1rmTitle", { lift: getLiftLabel(selectedLift) })}
          </Text>
          <Text variant="caption">{t("history.e1rmHelper")}</Text>
          {change != null ? (
            <Text
              style={[
                styles.chartChange,
                change > 0
                  ? styles.summaryChangePositive
                  : change < 0
                    ? styles.summaryChangeNegative
                    : styles.summaryChangeNeutral,
              ]}
            >
              {formatChange(change)}
            </Text>
          ) : null}
        </View>
        {latestPoint ? (
          <MetricPill
            label={t("history.latestE1rm")}
            value={formatMeasurement(latestPoint.value, unit)}
          />
        ) : null}
      </View>

      {trendPoints.length < MIN_TREND_POINTS ? (
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

export default function HistoryScreen() {
  useLocale();

  const router = useRouter();
  const { stubs, instance } = useProgramStore();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [selectedLift, setSelectedLift] = useState<MainLift>("deadlift");

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

        const nextItems = enriched.length === 0 && __DEV__ && instance
          ? buildMockHistoryItems(instance)
          : enriched;

        if (isActive) {
          setItems(nextItems);
        }
      }

      void load();

      return () => {
        isActive = false;
      };
    }, [instance, stubs]),
  );

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const { day, weekday } = formatHistoryDate(item.completedAt ?? null);
    const weekLabel = getWeekLabel(item.weekIndex);
    const sessionLabel = getSessionLabel(item.dayIndex);
    const isInteractive = !item.isMock;

    return (
      <Pressable
        disabled={!isInteractive}
        onPress={() => {
          if (!isInteractive) return;
          router.push(`/session/${item.sessionId}`);
        }}
      >
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
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.listContent}
      data={items}
      keyExtractor={(item) => item.sessionId}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      style={styles.safe}
      ListHeaderComponent={(
        <View style={styles.listHeader}>
          <View style={styles.chartSection}>
            <LiftSummaryCards
              items={items}
              selectedLift={selectedLift}
              unit={instance?.params.unit ?? "kg"}
              onSelect={setSelectedLift}
            />

            <LiftTrendCard
              selectedLift={selectedLift}
              items={items}
              unit={instance?.params.unit ?? "kg"}
            />

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
    paddingTop: spacing.sm,
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
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  summaryCardPressable: {
    width: "48%",
  },
  summaryCard: {
    minHeight: 122,
    padding: spacing.lg,
    gap: spacing.md,
  },
  summaryCardSelected: {
    backgroundColor: "rgba(34, 197, 94, 0.14)",
    borderColor: "rgba(34, 197, 94, 0.38)",
  },
  summaryCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  summaryLiftLabel: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  summaryActiveDot: {
    width: 9,
    height: 9,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    marginTop: spacing.xs,
  },
  summaryActiveDotSelected: {
    backgroundColor: colors.accent,
  },
  summaryLiftValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
  },
  summaryLiftChange: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  summaryChangePositive: {
    color: colors.accent,
  },
  summaryChangeNegative: {
    color: colors.destructive,
  },
  summaryChangeNeutral: {
    color: colors.textSecondary,
  },
  summaryChangePlaceholder: {
    color: colors.transparent,
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
  chartChange: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
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
