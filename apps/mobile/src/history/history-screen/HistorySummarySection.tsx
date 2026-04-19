import type { MainLift } from "@ownlift/schemas";
import { Image } from "expo-image";
import { useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Pressable, View } from "react-native";
import { Card, Text, colors } from "../../design";
import { formatNumber, getLiftLabel, t } from "../../i18n";
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
                    tintColor={isSelected ? colors.primaryForeground : colors.primary}
                  />
                ) : null}
              </View>

              <View style={styles.summaryCardBody}>
                <Text
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  numberOfLines={1}
                  style={[
                    styles.summaryLiftValue,
                    isSelected ? styles.summaryLiftValueSelected : null,
                  ]}
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
  const horizontalPadding = 16;
  const verticalPadding = 12;
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
        onLayout={(event: LayoutChangeEvent) => {
          const nextWidth = event.nativeEvent.layout.width;
          if (nextWidth !== chartWidth) {
            setChartWidth(nextWidth);
          }
        }}
        style={styles.trendPlot}
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
        {latestPoint ? (
          <MetricPill
            label={t("history.latestE1rm")}
            value={formatMeasurement(latestPoint.value, unit)}
          />
        ) : null}
      </View>

      {trendPoints.length < MIN_TREND_POINTS ? (
        <ChartEmptyState
          subtitle={t("history.e1rmEmptySubtitle")}
          title={t("history.e1rmEmptyTitle")}
        />
      ) : (
        <LiftTrendChart points={trendPoints} />
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
