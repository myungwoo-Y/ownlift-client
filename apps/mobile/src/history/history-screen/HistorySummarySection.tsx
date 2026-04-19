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

function formatTrendAxisValue(label: string): string {
  const value = Number(label);

  if (!Number.isFinite(value)) return label;

  return formatNumber(value, {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 1,
  });
}

function formatTrendPointDate(completedAt: string): string {
  return formatDate(completedAt, { month: "short", day: "numeric" });
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
  const chartData = useMemo<TrendChartDataItem[]>(
    () =>
      points.map((point) => ({
        label: point.label,
        trendPoint: point,
        value: point.value,
      })),
    [points],
  );
  const values = chartData.map((point) => point.value ?? 0);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const spread = maxValue - minValue;
  const padding = spread === 0 ? Math.max(maxValue * 0.05, 2) : spread * 0.18;
  const chartMin = Math.max(0, minValue - padding);
  const chartMax = maxValue + padding;

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
        {chartWidth > 0 ? (
          <LineChart
            adjustToWidth
            color={colors.accent}
            data={chartData}
            dataPointsColor="rgba(214, 255, 96, 0.36)"
            dataPointsRadius={4}
            disableScroll
            endSpacing={12}
            focusEnabled
            focusedDataPointColor={colors.accent}
            focusedDataPointIndex={selectedIndex}
            focusedDataPointRadius={6}
            formatYLabel={formatTrendAxisValue}
            height={LINE_CHART_HEIGHT}
            initialSpacing={12}
            labelsExtraHeight={10}
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
            xAxisColor="transparent"
            xAxisLabelTextStyle={styles.chartAxisLabel}
            xAxisLabelsHeight={20}
            xAxisLabelsVerticalShift={8}
            xAxisTextNumberOfLines={1}
            yAxisColor="transparent"
            yAxisLabelWidth={44}
            yAxisOffset={chartMin}
            yAxisTextStyle={styles.chartAxisLabel}
          />
        ) : null}
      </View>
      <Text style={styles.chartInteractionHint} variant="caption">
        {t("history.chartTapHint")}
      </Text>
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
  const trendPoints = useMemo(
    () => buildTrendPoints(items, selectedLift),
    [items, selectedLift],
  );
  const [selectedTrendIndex, setSelectedTrendIndex] = useState(Math.max(trendPoints.length - 1, 0));
  const latestPoint = trendPoints[trendPoints.length - 1];

  useEffect(() => {
    setSelectedTrendIndex(Math.max(trendPoints.length - 1, 0));
  }, [trendPoints]);

  const selectedPoint = trendPoints[selectedTrendIndex] ?? latestPoint ?? null;
  const selectedPreviousPoint = selectedTrendIndex > 0
    ? trendPoints[selectedTrendIndex - 1] ?? null
    : null;
  const change = selectedPoint && selectedPreviousPoint
    ? selectedPoint.value - selectedPreviousPoint.value
    : null;
  const selectedValueLabel = selectedTrendIndex === trendPoints.length - 1
    ? t("history.latestE1rm")
    : t("history.selectedE1rm");

  return (
    <Card style={[styles.chartCard, getLiftSurfaceStyle(selectedLift)]}>
      <View style={styles.chartCardHeader}>
        <View style={styles.chartCardLead}>
          <View style={styles.chartCardCopy}>
            <Text
              {...WORD_BREAK_TEXT_PROPS}
              style={styles.chartTitle}
            >
              {t("history.e1rmTitle", { lift: getLiftLabel(selectedLift) })}
            </Text>
            <Text style={styles.sectionHelper} variant="caption">
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
        {selectedPoint ? (
          <View style={styles.metricStack}>
            <MetricPill
              label={selectedValueLabel}
              value={formatMeasurement(selectedPoint.value, unit)}
            />
            <MetricPill
              label={t("history.sessionDate")}
              value={formatTrendPointDate(selectedPoint.completedAt)}
            />
          </View>
        ) : null}
      </View>

      {trendPoints.length < MIN_TREND_POINTS ? (
        <ChartEmptyState
          subtitle={t("history.e1rmEmptySubtitle")}
          title={t("history.e1rmEmptyTitle")}
        />
      ) : (
        <LiftTrendChart
          onSelectIndex={setSelectedTrendIndex}
          points={trendPoints}
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
  return (
    <>
      <LiftSummaryCards
        items={items}
        onSelect={onSelectLift}
        selectedLift={selectedLift}
        unit={unit}
      />
      <LiftTrendCard
        items={items}
        selectedLift={selectedLift}
        unit={unit}
      />
    </>
  );
}
