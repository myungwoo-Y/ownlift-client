import type { MainLift } from "@ownlift/schemas";
import { Image } from "expo-image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Pressable, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { LineGraph, type GraphPoint } from "react-native-graph";
import { Card, Text, colors, motion, spacing } from "../../design";
import { formatDate, formatNumber, getLiftLabel, t } from "../../i18n";
import { getLiftThumbnailSource } from "../../program/plan-screen/utils";
import { getLiftSurfaceStyle, styles } from "./styles";
import type { HistoryItem, TrendPoint } from "./types";
import {
  MIN_TREND_POINTS,
  SUMMARY_LIFTS,
  WORD_BREAK_TEXT_PROPS,
  buildLiftSummary,
  buildTrendPoints,
  formatChange,
  formatMeasurement,
} from "./utils";

interface HistorySummarySectionProps {
  items: HistoryItem[];
  selectedLift: MainLift;
  unit: string;
  onSelectLift: (lift: MainLift) => void;
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
      <Text style={styles.chartEmptySubtitle} variant="caption">
        {subtitle}
      </Text>
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
        const thumbnailSource = getLiftThumbnailSource(lift);

        return (
          <Pressable
            key={lift}
            onPress={() => onSelect(lift)}
            style={({ pressed }) => [
              styles.summaryCardPressable,
              pressed ? styles.cardPressablePressed : null,
            ]}
          >
            <Card style={[styles.summaryCard, getLiftSurfaceStyle(lift), isSelected && styles.summaryCardSelected]}>
              <View style={styles.summaryCardTopRow}>
                <Text
                  {...WORD_BREAK_TEXT_PROPS}
                  numberOfLines={2}
                  style={[
                    styles.summaryLiftLabel,
                    isSelected ? styles.summaryLiftLabelSelected : null,
                  ]}
                >
                  {getLiftLabel(lift)}
                </Text>
                {thumbnailSource ? (
                  <Image
                    contentFit="contain"
                    source={thumbnailSource}
                    style={styles.summaryThumbnailImage}
                    tintColor={colors.primary}
                  />
                ) : null}
              </View>

              <View style={styles.summaryCardBody}>
                <Text
                  numberOfLines={1}
                  style={styles.summaryLiftValue}
                >
                  {formatMeasurement(summary.latestPoint?.value ?? 0, unit)}
                </Text>

                <Text
                  style={styles.summaryLiftChange}
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

const TREND_RANGE_OPTIONS = [
  { key: "month", label: "M", dayWindow: 30 },
  { key: "year", label: "Y", dayWindow: 365 },
  { key: "all", label: "A", dayWindow: null },
] as const;
const TREND_RANGE_TABS_INSET = spacing["2xs"];

type TrendRangeKey = (typeof TREND_RANGE_OPTIONS)[number]["key"];

function formatTrendAxisValue(label: number | string): string {
  const value = Number(label);

  if (!Number.isFinite(value)) return String(label);

  return formatNumber(value, {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 1,
  });
}

function formatTrendPointSummary(point: TrendPoint, unit: string): string {
  return `${formatDate(point.completedAt, { month: "long", day: "numeric" })} / ${formatMeasurement(point.value, unit)}`;
}

function filterTrendPointsByRange(points: TrendPoint[], range: TrendRangeKey): TrendPoint[] {
  if (range === "all" || points.length === 0) return points;

  const anchor = new Date(points[points.length - 1]?.completedAt ?? "");
  const dayWindow = TREND_RANGE_OPTIONS.find((option) => option.key === range)?.dayWindow;

  if (Number.isNaN(anchor.getTime()) || dayWindow == null) return points;

  const cutoff = new Date(anchor);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (dayWindow - 1));

  return points.filter((point) => {
    const completedAt = new Date(point.completedAt);
    if (Number.isNaN(completedAt.getTime())) return false;
    return completedAt >= cutoff;
  });
}

function formatTrendXAxisLabel(completedAt: string): string {
  return formatDate(completedAt, { month: "numeric", day: "numeric" });
}

function buildTrendGraphPoints(points: TrendPoint[]): GraphPoint[] {
  return points.map((point) => ({
    date: new Date(point.completedAt),
    value: point.value,
  }));
}

function buildTrendXAxisLabels(points: TrendPoint[]): string[] {
  const maxVisibleLabels = 6;
  const labelStep = points.length <= maxVisibleLabels ? 1 : Math.ceil(points.length / maxVisibleLabels);

  return points
    .map((point, index) => {
      const shouldShowLabel = index === 0
        || index === points.length - 1
        || index % labelStep === 0;

      return shouldShowLabel ? formatTrendXAxisLabel(point.completedAt) : "";
    })
    .filter(Boolean);
}

function findTrendPointIndex(points: TrendPoint[], graphPoint: GraphPoint): number {
  const selectedTime = graphPoint.date.getTime();

  return points.findIndex((point) => {
    const pointTime = new Date(point.completedAt).getTime();
    return pointTime === selectedTime && point.value === graphPoint.value;
  });
}

function TrendRangeTabs({
  selectedRange,
  onSelectRange,
}: {
  selectedRange: TrendRangeKey;
  onSelectRange: (range: TrendRangeKey) => void;
}) {
  const [tabsWidth, setTabsWidth] = useState(0);
  const indicatorTranslateX = useSharedValue(0);
  const hasPositionedIndicatorRef = useRef(false);
  const selectedIndex = Math.max(
    TREND_RANGE_OPTIONS.findIndex((option) => option.key === selectedRange),
    0,
  );
  const tabWidth = tabsWidth > 0
    ? (tabsWidth - TREND_RANGE_TABS_INSET * 2) / TREND_RANGE_OPTIONS.length
    : 0;
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorTranslateX.value }],
  }));

  useEffect(() => {
    if (tabWidth <= 0) return;

    const nextTranslateX = selectedIndex * tabWidth;

    if (!hasPositionedIndicatorRef.current) {
      indicatorTranslateX.value = nextTranslateX;
      hasPositionedIndicatorRef.current = true;
      return;
    }

    indicatorTranslateX.value = withTiming(nextTranslateX, {
      duration: motion.duration.normal,
    });
  }, [indicatorTranslateX, selectedIndex, tabWidth]);

  return (
    <View
      onLayout={(event: LayoutChangeEvent) => {
        const nextWidth = event.nativeEvent.layout.width;
        if (nextWidth !== tabsWidth) {
          setTabsWidth(nextWidth);
        }
      }}
      style={styles.trendRangeTabs}
    >
      {tabWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.trendRangeTabIndicator,
            { width: tabWidth },
            indicatorStyle,
          ]}
        />
      ) : null}
      {TREND_RANGE_OPTIONS.map((option) => {
        const isSelected = option.key === selectedRange;

        return (
          <Pressable
            key={option.key}
            onPress={() => onSelectRange(option.key)}
            style={styles.trendRangeTab}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              style={[
                styles.trendRangeTabText,
                isSelected ? styles.trendRangeTabTextSelected : null,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function LiftTrendChart({
  points,
  onSelectIndex,
}: {
  points: TrendPoint[];
  onSelectIndex: (index: number) => void;
}) {
  const graphPoints = useMemo(() => buildTrendGraphPoints(points), [points]);
  const axisLabels = useMemo(() => buildTrendXAxisLabels(points), [points]);
  const values = graphPoints.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const spread = maxValue - minValue;
  const padding = spread === 0 ? Math.max(maxValue * 0.05, 2) : spread * 0.18;
  const chartMin = Math.max(0, minValue - padding);
  const chartMax = maxValue + padding;
  const chartMid = (chartMin + chartMax) / 2;

  return (
    <View style={styles.trendChart}>
      <View style={styles.trendPlot}>
        <View style={styles.trendGraphBody}>
          <View pointerEvents="none" style={styles.trendYAxis}>
            <Text numberOfLines={1} style={styles.chartAxisLabel}>
              {formatTrendAxisValue(chartMax)}
            </Text>
            <Text numberOfLines={1} style={styles.chartAxisLabel}>
              {formatTrendAxisValue(chartMid)}
            </Text>
            <Text numberOfLines={1} style={styles.chartAxisLabel}>
              {formatTrendAxisValue(chartMin)}
            </Text>
          </View>
          <View style={styles.trendGraphCanvas}>
            <View pointerEvents="none" style={[styles.trendGraphGridline, styles.trendGraphGridlineTop]} />
            <View pointerEvents="none" style={[styles.trendGraphGridline, styles.trendGraphGridlineMiddle]} />
            <View pointerEvents="none" style={[styles.trendGraphGridline, styles.trendGraphGridlineBottom]} />
            <LineGraph
              animated
              color={colors.accent}
              enableIndicator
              enablePanGesture
              horizontalPadding={spacing.md}
              indicatorPulsating={false}
              lineThickness={3}
              onPointSelected={(graphPoint) => {
                const nextIndex = findTrendPointIndex(points, graphPoint);
                if (nextIndex >= 0) {
                  onSelectIndex(nextIndex);
                }
              }}
              panGestureDelay={0}
              points={graphPoints}
              range={{
                y: {
                  min: chartMin,
                  max: chartMax,
                },
              }}
              style={styles.trendLineGraph}
              verticalPadding={spacing.xs}
            />
          </View>
        </View>
        <View style={styles.trendAxisLabels}>
          {axisLabels.map((label, index) => (
            <Text
              key={`${label}-${index}`}
              numberOfLines={1}
              style={styles.chartAxisLabel}
            >
              {label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

function LiftTrendCard({
  points,
  selectedLift,
  unit,
}: {
  points: TrendPoint[];
  selectedLift: MainLift;
  unit: string;
}) {
  const [selectedTrendIndex, setSelectedTrendIndex] = useState(Math.max(points.length - 1, 0));
  const latestPoint = points[points.length - 1];

  useEffect(() => {
    setSelectedTrendIndex(Math.max(points.length - 1, 0));
  }, [points]);

  const selectedPoint = points[selectedTrendIndex] ?? latestPoint ?? null;
  const selectedPreviousPoint = selectedTrendIndex > 0
    ? points[selectedTrendIndex - 1] ?? null
    : null;
  const change = selectedPoint && selectedPreviousPoint
    ? selectedPoint.value - selectedPreviousPoint.value
    : null;

  return (
    <Card style={[styles.chartCard, getLiftSurfaceStyle(selectedLift)]}>
      <View style={styles.chartMetaRow}>
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
        ) : (
          <View style={styles.chartChangePlaceholder} />
        )}
        {selectedPoint ? (
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.82}
            numberOfLines={1}
            style={styles.chartSelectionSummary}
          >
            {formatTrendPointSummary(selectedPoint, unit)}
          </Text>
        ) : null}
      </View>

      {points.length < MIN_TREND_POINTS ? (
        <ChartEmptyState
          subtitle={t("history.e1rmEmptySubtitle")}
          title={t("history.e1rmEmptyTitle")}
        />
      ) : (
        <LiftTrendChart
          onSelectIndex={setSelectedTrendIndex}
          points={points}
        />
      )}
    </Card>
  );
}

export function HistorySummarySection({
  items,
  selectedLift,
  unit,
  onSelectLift,
}: HistorySummarySectionProps) {
  const [selectedTrendRange, setSelectedTrendRange] = useState<TrendRangeKey>("month");
  const allTrendPoints = useMemo(
    () => buildTrendPoints(items, selectedLift, 0),
    [items, selectedLift],
  );
  const filteredTrendPoints = useMemo(
    () => filterTrendPointsByRange(allTrendPoints, selectedTrendRange),
    [allTrendPoints, selectedTrendRange],
  );

  return (
    <>
      <LiftSummaryCards
        items={items}
        onSelect={onSelectLift}
        selectedLift={selectedLift}
        unit={unit}
      />
      <View style={styles.trendSection}>
        <Text
          {...WORD_BREAK_TEXT_PROPS}
          style={styles.subSectionTitle}
        >
          {t("history.e1rmTitle", { lift: getLiftLabel(selectedLift) })}
        </Text>
        <TrendRangeTabs
          onSelectRange={setSelectedTrendRange}
          selectedRange={selectedTrendRange}
        />
        <LiftTrendCard
          points={filteredTrendPoints}
          selectedLift={selectedLift}
          unit={unit}
        />
      </View>
    </>
  );
}
