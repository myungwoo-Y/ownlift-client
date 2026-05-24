import type { MainLift } from "@ownlift/schemas";
import {
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  Line,
  Path,
  Skia,
  vec,
  type SkPath,
} from "@shopify/react-native-skia";
import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Pressable, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
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
                  {summary.latestPoint
                    ? formatMeasurement(summary.latestPoint.value, unit)
                    : t("history.noRecord")}
                </Text>

                <Text
                  style={[
                    styles.summaryLiftChange,
                    summary.change == null
                      ? null
                      : summary.change > 0
                        ? styles.summaryChangePositive
                        : summary.change < 0
                          ? styles.summaryChangeNegative
                          : styles.summaryChangeNeutral,
                  ]}
                >
                  {summary.change == null ? " " : `${formatChange(summary.change)}${unit}`}
                  {summary.change != null ? (
                    <Text style={styles.summaryLiftChangeLabel}>
                      {t("history.lift.change.suffix")}
                    </Text>
                  ) : null}
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
  { key: "month", labelKey: "history.trend.range.month", dayWindow: 30 },
  { key: "year", labelKey: "history.trend.range.year", dayWindow: 365 },
  { key: "all", labelKey: "history.trend.range.all", dayWindow: null },
] as const;
const TREND_RANGE_TABS_INSET = spacing["2xs"];
const TREND_GRAPH_HORIZONTAL_PADDING = spacing.md;
const TREND_GRAPH_VERTICAL_PADDING = spacing.xs;
const TREND_POINT_DOT_RADIUS = 3;
const TREND_POINT_DOT_OUTER_RADIUS = TREND_POINT_DOT_RADIUS + 2;
const TREND_SELECTED_DOT_RADIUS = 5;
const TREND_SELECTED_DOT_OUTER_RADIUS = TREND_SELECTED_DOT_RADIUS + 2;

type TrendRangeKey = (typeof TREND_RANGE_OPTIONS)[number]["key"];

interface TrendGraphPoint {
  value: number;
  date: Date;
}

interface TrendGraphSize {
  width: number;
  height: number;
}

interface TrendPixelPoint {
  x: number;
  y: number;
}

function formatTrendAxisValue(label: number | string): string {
  const value = Number(label);

  if (!Number.isFinite(value)) return String(label);

  return formatNumber(value, {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 1,
  });
}

function formatTrendPointSummary(point: TrendPoint, unit: string, selectedRange?: TrendRangeKey): string {
  const includeYear = selectedRange === "all" || selectedRange === "year";
  const dateOptions: Intl.DateTimeFormatOptions = includeYear
    ? { year: "numeric", month: "long", day: "numeric" }
    : { month: "long", day: "numeric" };
  return `${formatDate(point.completedAt, dateOptions)} / ${formatMeasurement(point.value, unit)}`;
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

function buildTrendGraphPoints(points: TrendPoint[]): TrendGraphPoint[] {
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

function buildTrendPixelPoints({
  points,
  graphSize,
  chartMin,
  chartMax,
}: {
  points: TrendGraphPoint[];
  graphSize: TrendGraphSize;
  chartMin: number;
  chartMax: number;
}): TrendPixelPoint[] {
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const drawingWidth = graphSize.width - TREND_GRAPH_HORIZONTAL_PADDING * 2;
  const drawingHeight = graphSize.height - TREND_GRAPH_VERTICAL_PADDING * 2;
  const xSpan = firstPoint && lastPoint
    ? lastPoint.date.getTime() - firstPoint.date.getTime()
    : 0;
  const ySpan = chartMax - chartMin;

  if (
    !firstPoint
    || !lastPoint
    || drawingWidth <= 0
    || drawingHeight <= 0
    || xSpan <= 0
    || ySpan <= 0
  ) {
    return [];
  }

  return points
    .map((point) => {
      const xPosition = (point.date.getTime() - firstPoint.date.getTime()) / xSpan;
      const yPosition = (point.value - chartMin) / ySpan;
      const x = Math.floor(drawingWidth * xPosition) + TREND_GRAPH_HORIZONTAL_PADDING;
      const y = drawingHeight - Math.floor(drawingHeight * yPosition) + TREND_GRAPH_VERTICAL_PADDING;

      return { x, y };
    })
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}

function buildTrendLinePath(points: TrendPixelPoint[]): SkPath | null {
  const firstPoint = points[0];

  if (!firstPoint) return null;

  const path = Skia.Path.Make();
  path.moveTo(firstPoint.x, firstPoint.y);

  if (points.length === 1) return path;

  for (let index = 0; index < points.length - 1; index += 1) {
    const previousPoint = points[index - 1] ?? points[index];
    const currentPoint = points[index];
    const nextPoint = points[index + 1];
    const nextNextPoint = points[index + 2] ?? nextPoint;

    if (!previousPoint || !currentPoint || !nextPoint || !nextNextPoint) continue;

    const controlPointOne = {
      x: currentPoint.x + (nextPoint.x - previousPoint.x) / 6,
      y: currentPoint.y + (nextPoint.y - previousPoint.y) / 6,
    };
    const controlPointTwo = {
      x: nextPoint.x - (nextNextPoint.x - currentPoint.x) / 6,
      y: nextPoint.y - (nextNextPoint.y - currentPoint.y) / 6,
    };

    path.cubicTo(
      controlPointOne.x,
      controlPointOne.y,
      controlPointTwo.x,
      controlPointTwo.y,
      nextPoint.x,
      nextPoint.y,
    );
  }

  return path;
}

function findNearestTrendPointIndex(points: TrendPixelPoint[], x: number): number {
  if (points.length === 0) return -1;

  return points.reduce((nearestIndex, point, index) => {
    const nearestPoint = points[nearestIndex];
    if (!nearestPoint) return index;

    return Math.abs(point.x - x) < Math.abs(nearestPoint.x - x)
      ? index
      : nearestIndex;
  }, 0);
}

function TrendGraphDrawing({
  linePath,
  pixelPoints,
  selectedIndex,
  graphSize,
  showPointDots,
}: {
  linePath: SkPath | null;
  pixelPoints: TrendPixelPoint[];
  selectedIndex: number;
  graphSize: TrendGraphSize;
  showPointDots: boolean;
}) {
  const selectedPoint = pixelPoints[selectedIndex] ?? pixelPoints[pixelPoints.length - 1];

  if (!linePath) return null;

  return (
    <Canvas pointerEvents="none" style={styles.trendGraphCanvasDrawing}>
      {selectedPoint ? (
        <Line
          p1={vec(selectedPoint.x, TREND_GRAPH_VERTICAL_PADDING)}
          p2={vec(selectedPoint.x, graphSize.height - TREND_GRAPH_VERTICAL_PADDING)}
          color={colors.primarySoft}
          strokeWidth={1.5}
        >
          <DashPathEffect intervals={[4, 6]} />
        </Line>
      ) : null}

      <Path
        path={linePath}
        color={colors.accent}
        style="stroke"
        strokeWidth={3}
        strokeCap="round"
        strokeJoin="round"
      />

      {showPointDots
        ? pixelPoints.map((point, index) => {
          const isSelected = index === selectedIndex;

          return (
            <Group key={`${point.x}-${point.y}-${index}`}>
              <Circle
                cx={point.x}
                cy={point.y}
                r={isSelected ? TREND_SELECTED_DOT_OUTER_RADIUS : TREND_POINT_DOT_OUTER_RADIUS}
                color={colors.surfaceElevated}
              />
              <Circle
                cx={point.x}
                cy={point.y}
                r={isSelected ? TREND_SELECTED_DOT_RADIUS : TREND_POINT_DOT_RADIUS}
                color={colors.accent}
              />
            </Group>
          );
        })
        : null}
      {!showPointDots && selectedPoint ? (
        <Group>
          <Circle
            cx={selectedPoint.x}
            cy={selectedPoint.y}
            r={TREND_SELECTED_DOT_OUTER_RADIUS}
            color={colors.surfaceElevated}
          />
          <Circle
            cx={selectedPoint.x}
            cy={selectedPoint.y}
            r={TREND_SELECTED_DOT_RADIUS}
            color={colors.accent}
          />
        </Group>
      ) : null}
    </Canvas>
  );
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
              {t(option.labelKey)}
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
  selectedIndex,
  showPointDots,
}: {
  points: TrendPoint[];
  onSelectIndex: (index: number) => void;
  selectedIndex: number;
  showPointDots: boolean;
}) {
  const [graphSize, setGraphSize] = useState<TrendGraphSize>({ width: 0, height: 0 });
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
  const pixelPoints = useMemo(
    () => buildTrendPixelPoints({
      points: graphPoints,
      graphSize,
      chartMin,
      chartMax,
    }),
    [chartMax, chartMin, graphPoints, graphSize],
  );
  const linePath = useMemo(() => buildTrendLinePath(pixelPoints), [pixelPoints]);
  const handleSelectNearestPoint = useCallback(
    (x: number) => {
      const nextIndex = findNearestTrendPointIndex(pixelPoints, x);

      if (nextIndex >= 0) {
        onSelectIndex(nextIndex);
      }
    },
    [onSelectIndex, pixelPoints],
  );
  const chartGesture = useMemo(
    () => Gesture.Simultaneous(
      Gesture.Tap()
        .runOnJS(true)
        .onEnd((event) => {
          handleSelectNearestPoint(event.x);
        }),
      Gesture.Pan()
        .minDistance(1)
        .runOnJS(true)
        .onBegin((event) => {
          handleSelectNearestPoint(event.x);
        })
        .onUpdate((event) => {
          handleSelectNearestPoint(event.x);
        }),
    ),
    [handleSelectNearestPoint],
  );

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
          <GestureDetector gesture={chartGesture}>
            <View
              onLayout={(event: LayoutChangeEvent) => {
                const { width, height } = event.nativeEvent.layout;

                setGraphSize((currentSize) => (
                  currentSize.width === width && currentSize.height === height
                    ? currentSize
                    : { width, height }
                ));
              }}
              style={styles.trendGraphCanvas}
            >
              <View pointerEvents="none" style={[styles.trendGraphGridline, styles.trendGraphGridlineTop]} />
              <View pointerEvents="none" style={[styles.trendGraphGridline, styles.trendGraphGridlineMiddle]} />
              <View pointerEvents="none" style={[styles.trendGraphGridline, styles.trendGraphGridlineBottom]} />
              <TrendGraphDrawing
                graphSize={graphSize}
                linePath={linePath}
                pixelPoints={pixelPoints}
                selectedIndex={selectedIndex}
                showPointDots={showPointDots}
              />
            </View>
          </GestureDetector>
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
  showPointDots,
  unit,
  selectedRange,
}: {
  points: TrendPoint[];
  selectedLift: MainLift;
  showPointDots: boolean;
  unit: string;
  selectedRange: TrendRangeKey;
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
            {formatTrendPointSummary(selectedPoint, unit, selectedRange)}
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
          showPointDots={showPointDots}
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
          showPointDots={selectedTrendRange === "month"}
          unit={unit}
          selectedRange={selectedTrendRange}
        />
      </View>
    </>
  );
}
