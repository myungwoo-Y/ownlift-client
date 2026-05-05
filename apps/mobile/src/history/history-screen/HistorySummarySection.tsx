import type { MainLift } from "@ownlift/schemas";
import { Image } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Pressable, View } from "react-native";
import { LineChart, type lineDataItem } from "react-native-gifted-charts";
import { Card, Text, colors } from "../../design";
import { formatDate, formatNumber, getLiftLabel, t } from "../../i18n";
import { getLiftThumbnailSource } from "../../program/plan-screen/utils";
import { LINE_CHART_HEIGHT, getLiftSurfaceStyle, styles } from "./styles";
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

type TrendChartDataItem = lineDataItem & {
  trendPoint: TrendPoint;
};

const TREND_CHART_Y_AXIS_LABEL_WIDTH = 44;
const TREND_CHART_RIGHT_INSET = 20;
const TREND_RANGE_OPTIONS = [
  { key: "week", label: "W", dayWindow: 7 },
  { key: "month", label: "M", dayWindow: 30 },
  { key: "year", label: "Y", dayWindow: 365 },
  { key: "all", label: "A", dayWindow: null },
] as const;

type TrendRangeKey = (typeof TREND_RANGE_OPTIONS)[number]["key"];

function formatTrendAxisValue(label: string): string {
  const value = Number(label);

  if (!Number.isFinite(value)) return label;

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

function buildTrendChartData(points: TrendPoint[]): TrendChartDataItem[] {
  const maxVisibleLabels = 6;
  const labelStep = points.length <= maxVisibleLabels ? 1 : Math.ceil(points.length / maxVisibleLabels);

  return points.map((point, index) => {
    const shouldShowLabel = index === 0
      || index === points.length - 1
      || index % labelStep === 0;

    return {
      label: shouldShowLabel ? formatTrendXAxisLabel(point.completedAt) : "",
      trendPoint: point,
      value: point.value,
    };
  });
}

function TrendRangeTabs({
  selectedRange,
  onSelectRange,
}: {
  selectedRange: TrendRangeKey;
  onSelectRange: (range: TrendRangeKey) => void;
}) {
  return (
    <View style={styles.trendRangeTabs}>
      {TREND_RANGE_OPTIONS.map((option) => {
        const isSelected = option.key === selectedRange;

        return (
          <Pressable
            key={option.key}
            onPress={() => onSelectRange(option.key)}
            style={({ pressed }) => [
              styles.trendRangeTab,
              isSelected ? styles.trendRangeTabSelected : null,
              pressed ? styles.trendRangeTabPressed : null,
            ]}
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
  selectedIndex,
  onSelectIndex,
}: {
  points: TrendPoint[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
}) {
  const [chartWidth, setChartWidth] = useState(0);
  const chartData = useMemo<TrendChartDataItem[]>(() => buildTrendChartData(points), [points]);
  const values = chartData.map((point) => point.value ?? 0);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const spread = maxValue - minValue;
  const padding = spread === 0 ? Math.max(maxValue * 0.05, 2) : spread * 0.18;
  const chartMin = Math.max(0, minValue - padding);
  const chartMax = maxValue + padding;
  const chartViewportWidth = Math.max(
    chartWidth - TREND_CHART_Y_AXIS_LABEL_WIDTH - TREND_CHART_RIGHT_INSET,
    0,
  );

  return (
    <View style={styles.trendChart}>
      <View
        onLayout={(event: LayoutChangeEvent) => {
          const nextWidth = event.nativeEvent.layout.width;
          if (nextWidth !== chartWidth) {
            setChartWidth(nextWidth);
          }
        }}
        style={styles.trendPlot}
      >
        {chartViewportWidth > 0 ? (
          <LineChart
            adjustToWidth
            color={colors.accent}
            data={chartData}
            dataPointsColor="rgba(214, 255, 96, 0.36)"
            dataPointsRadius={4}
            disableScroll
            endSpacing={30}
            focusEnabled
            focusedDataPointColor={colors.accent}
            focusedDataPointIndex={selectedIndex}
            focusedDataPointRadius={6}
            formatYLabel={formatTrendAxisValue}
            height={LINE_CHART_HEIGHT}
            hideOrigin
            initialSpacing={18}
            labelsExtraHeight={14}
            maxValue={Math.max(chartMax - chartMin, 1)}
            noOfSections={2}
            onFocus={(_: TrendChartDataItem, index: number) => {
              onSelectIndex(index);
            }}
            parentWidth={chartWidth}
            rulesColor="rgba(255, 255, 255, 0.06)"
            rulesThickness={1}
            showStripOnFocus
            stripColor="rgba(214, 255, 96, 0.24)"
            stripStrokeDashArray={[4, 4]}
            stripWidth={1}
            thickness={3}
            unFocusOnPressOut={false}
            width={chartViewportWidth}
            xAxisColor="rgba(255, 255, 255, 0.14)"
            xAxisLabelTextStyle={styles.chartAxisLabel}
            xAxisLabelsHeight={24}
            xAxisLabelsVerticalShift={12}
            xAxisTextNumberOfLines={1}
            xAxisThickness={1}
            yAxisColor="rgba(255, 255, 255, 0.14)"
            yAxisLabelWidth={TREND_CHART_Y_AXIS_LABEL_WIDTH}
            yAxisOffset={chartMin}
            yAxisThickness={1}
            yAxisTextStyle={styles.chartAxisLabel}
          />
        ) : null}
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
          selectedIndex={selectedTrendIndex}
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
