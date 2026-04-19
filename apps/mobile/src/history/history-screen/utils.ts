import { calcE1RM } from "@ownlift/core";
import type { SetLogRecord } from "@ownlift/db";
import type { MainLift } from "@ownlift/schemas";
import { formatDate as formatLocaleDate, formatNumber, getLiftLabel, t } from "../../i18n";
import type { HistoryFilterOption } from "../history-filter-store";
import type { HistoryItem, LiftSummary, TrendPoint } from "./types";

export const SUMMARY_LIFTS: readonly MainLift[] = [
  "deadlift",
  "squat",
  "bench",
  "press",
];
export const MAX_TREND_POINTS = 8;
export const MIN_TREND_POINTS = 2;
export const WORD_BREAK_TEXT_PROPS = {
  lineBreakStrategyIOS: "hangul-word" as const,
};

export function getHistoryItemDate(item: HistoryItem): string | null {
  return item.completedAt ?? item.scheduledDate ?? null;
}

export function getHistoryMonthKey(dateStr: string | null): string | null {
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

export function buildMonthFilterOptions(items: HistoryItem[]): HistoryFilterOption[] {
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

export function buildLiftFilterOptions(items: HistoryItem[]): HistoryFilterOption[] {
  const options: HistoryFilterOption[] = [{ key: "all", label: t("history.filter.all") }];

  for (const lift of SUMMARY_LIFTS) {
    if (!items.some((item) => item.mainLiftKey === lift)) continue;
    options.push({ key: lift, label: getLiftLabel(lift) });
  }

  return options;
}

export function getFilterOptionLabel(options: HistoryFilterOption[], key: string): string | null {
  return options.find((option) => option.key === key)?.label ?? null;
}

export function formatHistoryDate(dateStr: string | null): { day: string; weekday: string } {
  if (!dateStr) return { day: "", weekday: "" };

  const date = new Date(dateStr);
  return {
    day: formatLocaleDate(date, { month: "short", day: "numeric" }),
    weekday: formatLocaleDate(date, { weekday: "long" }),
  };
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

export function getSessionEstimatedOneRepMax(logs: SetLogRecord[]): number | null {
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

export function buildTrendPoints(
  items: HistoryItem[],
  lift: MainLift,
  limit = MAX_TREND_POINTS,
): TrendPoint[] {
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

export function formatMeasurement(value: number, unit: string): string {
  return `${formatNumber(value, { maximumFractionDigits: 1 })} ${unit}`;
}

export function formatChange(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${formatNumber(Math.abs(value), { maximumFractionDigits: 1 })}`;
}

export function buildLiftSummary(items: HistoryItem[], lift: MainLift): LiftSummary {
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
