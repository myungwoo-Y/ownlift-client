import type { MainLift } from "@ownlift/schemas";
import { StyleSheet } from "react-native";
import { borderRadius, colors, fontSize, fontWeight, spacing } from "../../design";

export const LINE_CHART_HEIGHT = 152;

export const styles = StyleSheet.create({
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
  trendSection: {
    gap: spacing.md,
  },
  trendRangeTabs: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing["2xs"],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  trendRangeTab: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.full,
  },
  trendRangeTabSelected: {
    backgroundColor: colors.accent,
  },
  trendRangeTabPressed: {
    opacity: 0.92,
  },
  trendRangeTabText: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
  },
  trendRangeTabTextSelected: {
    color: colors.primaryForeground,
    fontWeight: fontWeight.semibold,
  },
  logSection: {
    gap: spacing.md,
  },
  monthSectionHeader: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    backgroundColor: colors.background,
  },
  monthSectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    lineHeight: 22,
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
    minHeight: 136,
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
    fontSize: 14,
    fontWeight: fontWeight.semibold,
    color: "rgba(245, 245, 247, 0.7)",
    lineHeight: 16,
  },
  summaryLiftLabelSelected: {
    color: colors.text,
    fontWeight: fontWeight.bold
  },
  summaryLiftValue: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  summaryLiftValueSelected: {
    color: "#FAFAFB",
  },
  summaryLiftChange: {
    fontSize: fontSize.md,
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
  chartChangePlaceholder: {
    minHeight: 18,
    minWidth: 32,
  },
  chartMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  chartSelectionSummary: {
    flex: 1,
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    lineHeight: 18,
    textAlign: "right",
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
    height: LINE_CHART_HEIGHT + 52,
    borderRadius: borderRadius.lg,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  chartAxisLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    lineHeight: 14,
  },
  chartInteractionHint: {
    color: colors.textSecondary,
    lineHeight: 16,
    paddingHorizontal: spacing.xs,
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

export function getLiftSurfaceStyle(lift: MainLift) {
  if (lift === "bench") return styles.liftSurfaceBench;
  if (lift === "deadlift") return styles.liftSurfaceDeadlift;
  if (lift === "press") return styles.liftSurfacePress;
  return styles.liftSurfaceSquat;
}
