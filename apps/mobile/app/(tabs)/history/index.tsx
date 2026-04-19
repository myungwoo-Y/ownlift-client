import { Ionicons } from "@expo/vector-icons";
import { calcE1RM } from "@ownlift/core";
import type { SessionStubRecord, SetLogRecord } from "@ownlift/db";
import { getSetLogsBySession, getWorkoutResultBySession } from "@ownlift/db";
import type { MainLift } from "@ownlift/schemas";
import { useFocusEffect, useRouter } from "expo-router";
import { Image } from "expo-image";
import { useCallback, useEffect, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { FlatList, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Badge, Card, borderRadius, colors, fontSize, fontWeight, spacing, Text } from "../../../src/design";
import { useHistoryFilterStore, type HistoryFilterOption } from "../../../src/history/history-filter-store";
import { buildMockHistoryItems } from "../../../src/history/mock-history";
import { formatDate as formatLocaleDate, formatNumber, getLiftLabel, getSessionLabel, getWeekLabel, t, useLocale } from "../../../src/i18n";
import { getLiftThumbnailSource } from "../../../src/program/plan-screen/utils";
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
const WORD_BREAK_TEXT_PROPS = {
  lineBreakStrategyIOS: "hangul-word" as const,
};

function getLiftSurfaceStyle(lift: MainLift) {
  if (lift === "bench") return styles.liftSurfaceBench;
  if (lift === "deadlift") return styles.liftSurfaceDeadlift;
  if (lift === "press") return styles.liftSurfacePress;
  return styles.liftSurfaceSquat;
}

function getHistoryItemDate(item: HistoryItem): string | null {
  return item.completedAt ?? item.scheduledDate ?? null;
}

function getHistoryMonthKey(dateStr: string | null): string | null {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatHistoryMonthLabel(dateStr: string, includeYear: boolean): string {
  return formatLocaleDate(dateStr, {
    month: "long",
    ...(includeYear ? { year: "numeric" } : {}),
  });
}

function buildMonthFilterOptions(items: HistoryItem[]): HistoryFilterOption[] {
  const options: HistoryFilterOption[] = [{ key: "all", label: t("history.filter.all") }];
  const seenMonthKeys = new Set<string>();
  const availableYears = new Set(
    items
      .map((item) => getHistoryItemDate(item))
      .filter((value): value is string => Boolean(value))
      .map((value) => new Date(value).getFullYear()),
  );
  const includeYear = availableYears.size > 1;

  for (const item of items) {
    const dateValue = getHistoryItemDate(item);
    const monthKey = getHistoryMonthKey(dateValue);
    if (!dateValue || !monthKey || seenMonthKeys.has(monthKey)) continue;

    seenMonthKeys.add(monthKey);
    options.push({
      key: monthKey,
      label: formatHistoryMonthLabel(dateValue, includeYear),
    });
  }

  return options;
}

function buildLiftFilterOptions(items: HistoryItem[]): HistoryFilterOption[] {
  const options: HistoryFilterOption[] = [{ key: "all", label: t("history.filter.all") }];

  for (const lift of SUMMARY_LIFTS) {
    if (!items.some((item) => item.mainLiftKey === lift)) continue;
    options.push({ key: lift, label: getLiftLabel(lift) });
  }

  return options;
}

function getFilterOptionLabel(options: HistoryFilterOption[], key: string): string | null {
  return options.find((option) => option.key === key)?.label ?? null;
}

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
        const liftSurfaceStyle = getLiftSurfaceStyle(lift);
        const thumbnailSource = getLiftThumbnailSource(lift);
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
            style={({ pressed }) => [
              styles.summaryCardPressable,
              pressed ? styles.cardPressablePressed : null,
            ]}
            onPress={() => onSelect(lift)}
          >
            <Card style={[styles.summaryCard, liftSurfaceStyle, isSelected && styles.summaryCardSelected]}>
              <View style={styles.summaryCardTopRow}>
                <Text
                  {...WORD_BREAK_TEXT_PROPS}
                  style={[
                    styles.summaryLiftLabel,
                    isSelected ? styles.summaryLiftLabelSelected : null,
                  ]}
                  numberOfLines={2}
                >
                  {getLiftLabel(lift)}
                </Text>
                {thumbnailSource ? (
                  <Image
                    source={thumbnailSource}
                    contentFit="contain"
                    style={styles.summaryThumbnailImage}
                    tintColor={isSelected ? colors.primaryForeground : colors.primary}
                  />
                ) : null}
              </View>

              <View style={styles.summaryCardBody}>
                <Text
                  style={[
                    styles.summaryLiftValue,
                    isSelected ? styles.summaryLiftValueSelected : null,
                  ]}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  numberOfLines={1}
                >
                  {summary.latestPoint ? formatMeasurement(summary.latestPoint.value, unit) : "—"}
                </Text>

                <Text
                  style={[
                    styles.summaryLiftChange,
                    changeStyle,
                  ]}
                >
                  {summary.change == null ? " " : formatChange(summary.change)}
                </Text>
              </View>
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
  const thumbnailSource = getLiftThumbnailSource(selectedLift);

  return (
    <Card style={[styles.chartCard, getLiftSurfaceStyle(selectedLift)]}>
      <View style={styles.chartCardHeader}>
        <View style={styles.chartCardLead}>
          {thumbnailSource ? (
            <Image
              source={thumbnailSource}
              contentFit="contain"
              style={styles.summaryThumbnailImage}
              tintColor={colors.primary}
            />
          ) : null}
          <View style={styles.chartCardCopy}>
            <Text
              {...WORD_BREAK_TEXT_PROPS}
              style={styles.chartTitle}
            >
              {t("history.e1rmTitle", { lift: getLiftLabel(selectedLift) })}
            </Text>
            <Text variant="caption" style={styles.sectionHelper}>
              {t("history.e1rmHelper")}
            </Text>
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
  const selectedMonthKey = useHistoryFilterStore((state) => state.selectedMonthKey);
  const selectedListLift = useHistoryFilterStore((state) => state.selectedListLift);
  const setSelectedMonthKey = useHistoryFilterStore((state) => state.setSelectedMonthKey);
  const setSelectedListLift = useHistoryFilterStore((state) => state.setSelectedListLift);
  const setAvailableOptions = useHistoryFilterStore((state) => state.setAvailableOptions);
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

  const monthFilterOptions = buildMonthFilterOptions(items);
  const liftFilterOptions = buildLiftFilterOptions(items);

  useEffect(() => {
    setAvailableOptions(monthFilterOptions, liftFilterOptions);
  }, [liftFilterOptions, monthFilterOptions, setAvailableOptions]);

  const activeMonthKey = monthFilterOptions.some((option) => option.key === selectedMonthKey)
    ? selectedMonthKey
    : "all";
  const activeListLift = liftFilterOptions.some((option) => option.key === selectedListLift)
    ? selectedListLift
    : "all";
  const unitLabel = instance?.params.unit ?? "kg";
  const filteredItems = items.filter((item) => {
    const itemMonthKey = getHistoryMonthKey(getHistoryItemDate(item));
    const matchesMonth = activeMonthKey === "all" || itemMonthKey === activeMonthKey;
    const matchesLift = activeListLift === "all" || item.mainLiftKey === activeListLift;
    return matchesMonth && matchesLift;
  });
  const hasActiveFilters = activeMonthKey !== "all" || activeListLift !== "all";
  const activeFilterCount = Number(activeMonthKey !== "all") + Number(activeListLift !== "all");
  const activeFilterChips = [
    activeMonthKey !== "all"
      ? {
        key: "month",
        label: getFilterOptionLabel(monthFilterOptions, activeMonthKey) ?? activeMonthKey,
        onRemove: () => setSelectedMonthKey("all"),
      }
      : null,
    activeListLift !== "all"
      ? {
        key: "lift",
        label: getFilterOptionLabel(liftFilterOptions, activeListLift) ?? activeListLift,
        onRemove: () => setSelectedListLift("all"),
      }
      : null,
  ].filter((chip): chip is { key: string; label: string; onRemove: () => void } => Boolean(chip));

  function openFilterScreen(): void {
    router.push("/(tabs)/history/filters");
  }

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const { day, weekday } = formatHistoryDate(getHistoryItemDate(item));
    const weekLabel = getWeekLabel(item.weekIndex);
    const sessionLabel = getSessionLabel(item.dayIndex);
    const isInteractive = !item.isMock;
    const thumbnailSource = getLiftThumbnailSource(item.mainLiftKey);
    const dateLabel = [day, weekday].filter(Boolean).join(" · ");

    return (
      <Pressable
        disabled={!isInteractive}
        onPress={() => {
          if (!isInteractive) return;
          router.push(`/session/${item.sessionId}`);
        }}
        style={({ pressed }) => [
          pressed && isInteractive ? styles.cardPressablePressed : null,
        ]}
      >
        <Card style={[styles.historyCard, getLiftSurfaceStyle(item.mainLiftKey)]}>
          <View style={styles.historyItem}>
            {thumbnailSource ? (
              <View style={styles.historyThumbnailFrame}>
                <Image
                  source={thumbnailSource}
                  contentFit="contain"
                  style={styles.historyThumbnailImage}
                  tintColor={colors.primary}
                />
              </View>
            ) : null}
            <View style={styles.detailColumn}>
              <View style={styles.titleRow}>
                <View style={styles.titleCopy}>
                  <Text
                    {...WORD_BREAK_TEXT_PROPS}
                    style={styles.historyLiftName}
                  >
                    {getLiftLabel(item.mainLiftKey)}
                  </Text>
                  {dateLabel ? (
                    <Text variant="caption" style={styles.historyDateMeta}>
                      {dateLabel}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.badges}>
                  <Badge variant="completed" label={t("status.completed")} />
                </View>
              </View>
              <Text variant="caption" style={styles.historySessionMeta}>
                {sessionLabel} · {t("week.title", { week: item.weekIndex + 1 })} · {weekLabel}
              </Text>
              {item.totalVolume != null || item.estimatedOneRepMax != null ? (
                <View style={styles.historyMetricRow}>
                  {item.totalVolume != null ? (
                    <View style={[styles.historyMetricChip, styles.historyMetricChipPrimary]}>
                      <Text style={styles.historyMetricText}>
                        {t("history.volume", {
                          volume: formatNumber(item.totalVolume),
                          unit: unitLabel,
                        })}
                      </Text>
                    </View>
                  ) : null}
                  {item.estimatedOneRepMax != null ? (
                    <View style={styles.historyMetricChip}>
                      <Text style={styles.historyMetricText}>
                        {`e1RM ${formatMeasurement(item.estimatedOneRepMax, unitLabel)}`}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <>
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.listContent}
        data={filteredItems}
        keyExtractor={(item) => item.sessionId}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        style={styles.safe}
        ListHeaderComponent={(
          <View style={styles.listHeader}>
            <View style={styles.chartSection}>
              <View style={styles.chartSectionHeader}>
                <Text style={styles.sectionTitle}>{t("history.allLiftTrendTitle")}</Text>
                <Text variant="caption" style={styles.sectionHelper}>
                  {t("history.allLiftTrendHelper")}
                </Text>
              </View>
              <LiftSummaryCards
                items={items}
                selectedLift={selectedLift}
                unit={unitLabel}
                onSelect={setSelectedLift}
              />

              <LiftTrendCard
                selectedLift={selectedLift}
                items={items}
                unit={unitLabel}
              />
            </View>

            {items.length > 0 ? (
              <View style={styles.logSection}>
                <View style={styles.logHeaderRow}>
                  <Text style={styles.sectionTitle}>{t("history.completedWorkouts")}</Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.filterTrigger,
                      pressed ? styles.filterTriggerPressed : null,
                    ]}
                    onPress={openFilterScreen}
                  >
                    <Ionicons name="options-outline" size={16} color={colors.text} />
                    <Text style={styles.filterTriggerText}>{t("history.filter.open")}</Text>
                    {activeFilterCount > 0 ? (
                      <View style={styles.filterTriggerCount}>
                        <Text style={styles.filterTriggerCountText}>{activeFilterCount}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                </View>

                {activeFilterChips.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.activeFilterRow}
                  >
                    {activeFilterChips.map((chip) => (
                      <Pressable
                        key={chip.key}
                        style={({ pressed }) => [
                          styles.activeFilterChip,
                          pressed ? styles.activeFilterChipPressed : null,
                        ]}
                        onPress={chip.onRemove}
                      >
                        <Text style={styles.activeFilterChipText}>{chip.label}</Text>
                        <Ionicons name="close" size={14} color={colors.text} />
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : null}
              </View>
            ) : null}
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.empty}>
            <Card style={styles.emptyCard}>
              <Text variant="body" style={styles.emptyText}>
                {items.length === 0
                  ? t("history.emptyTitle")
                  : hasActiveFilters
                    ? t("history.filteredEmptyTitle")
                    : t("history.emptyTitle")}
              </Text>
              <Text variant="caption" style={styles.emptyText}>
                {items.length === 0
                  ? t("history.emptySubtitle")
                  : hasActiveFilters
                    ? t("history.filteredEmptySubtitle")
                    : t("history.emptySubtitle")}
              </Text>
            </Card>
          </View>
        )}
      />
    </>
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
    gap: spacing["2xl"],
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  chartSectionHeader: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    lineHeight: 24,
    color: colors.text,
  },
  sectionHelper: {
    lineHeight: 18,
  },
  chartSection: {
    gap: spacing.lg,
  },
  logSection: {
    gap: spacing.md,
  },
  logHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  filterTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 38,
    borderRadius: borderRadius.lg,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    backgroundColor: "rgba(20, 20, 22, 0.92)",
  },
  filterTriggerPressed: {
    backgroundColor: "rgba(16, 16, 18, 0.96)",
    transform: [{ scale: 0.97 }],
  },
  filterTriggerText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  filterTriggerCount: {
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  filterTriggerCountText: {
    color: colors.primaryForeground,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  activeFilterRow: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  activeFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(214, 255, 96, 0.28)",
    backgroundColor: "rgba(214, 255, 96, 0.12)",
  },
  activeFilterChipPressed: {
    transform: [{ scale: 0.98 }],
  },
  activeFilterChipText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  summaryCardPressable: {
    width: "48%",
  },
  cardPressablePressed: {
    transform: [{ scale: 0.985 }],
  },
  summaryCard: {
    minHeight: 156,
    padding: spacing.lg,
    justifyContent: "space-between",
    borderRadius: 28,
    borderCurve: "continuous",
    boxShadow: "0px 22px 44px rgba(0, 0, 0, 0.18)",
  },
  summaryCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  summaryThumbnailImage: {
    width: 40,
    height: 40,
    flexShrink: 0,
  },
  summaryCardBody: {
    gap: spacing.sm,
  },
  summaryCardSelected: {
    backgroundColor: "rgba(214, 255, 96, 0.08)",
    borderColor: "rgba(214, 255, 96, 0.28)",
  },
  summaryLiftLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: fontWeight.semibold,
    color: "rgba(245, 245, 247, 0.7)",
    lineHeight: 16,
  },
  summaryLiftLabelSelected: {
    color: colors.text,
  },
  summaryLiftValue: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
  },
  summaryLiftValueSelected: {
    color: "#FAFAFB",
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
    gap: spacing.xl,
    borderRadius: 28,
    borderCurve: "continuous",
    padding: spacing.lg,
    boxShadow: "0px 22px 44px rgba(0, 0, 0, 0.18)",
  },
  chartCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  chartCardLead: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  chartCardCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  chartTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: fontWeight.extrabold,
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
    borderColor: "rgba(214, 255, 96, 0.24)",
    backgroundColor: "rgba(214, 255, 96, 0.12)",
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
    backgroundColor: "rgba(255, 255, 255, 0.03)",
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
    borderRadius: 28,
    borderCurve: "continuous",
    boxShadow: "0px 18px 38px rgba(0, 0, 0, 0.18)",
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  historyThumbnailFrame: {
    width: 68,
    height: 68,
    borderRadius: 18,
    borderCurve: "continuous",
    backgroundColor: colors.primarySoft,
    padding: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  historyThumbnailImage: {
    width: "100%",
    height: "100%",
  },
  detailColumn: {
    flex: 1,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  titleCopy: {
    flex: 1,
    gap: 2,
  },
  historyLiftName: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
    color: colors.text,
  },
  historyDateMeta: {
    color: "rgba(245, 245, 247, 0.68)",
  },
  historySessionMeta: {
    color: colors.textSecondary,
    lineHeight: 18,
  },
  historyMetricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  historyMetricChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  historyMetricChipPrimary: {
    borderColor: "rgba(214, 255, 96, 0.2)",
    backgroundColor: "rgba(214, 255, 96, 0.12)",
  },
  historyMetricText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  badges: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  empty: {
    paddingVertical: spacing["2xl"],
  },
  emptyCard: {
    gap: spacing.sm,
    borderRadius: 28,
    borderCurve: "continuous",
    alignItems: "center",
    paddingVertical: spacing["3xl"],
  },
  emptyText: {
    textAlign: "center",
  },
  liftSurfaceSquat: {
    backgroundColor: colors.surfaceElevated,
    borderColor: "rgba(146, 180, 245, 0.12)",
  },
  liftSurfaceBench: {
    backgroundColor: colors.surfaceElevated,
    borderColor: "rgba(228, 134, 116, 0.12)",
  },
  liftSurfaceDeadlift: {
    backgroundColor: colors.surfaceElevated,
    borderColor: "rgba(117, 180, 194, 0.12)",
  },
  liftSurfacePress: {
    backgroundColor: colors.surfaceElevated,
    borderColor: "rgba(157, 207, 100, 0.12)",
  },
});
