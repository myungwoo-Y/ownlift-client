import { StyleSheet } from "react-native";
import { borderRadius, colors, spacing } from "../../design";
import { TAB_BAR_CLEARANCE } from "./constants";

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing["2xl"],
    paddingBottom: spacing["4xl"] + TAB_BAR_CLEARANCE,
    gap: spacing["2xl"],
  },
  screenMeta: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  headerEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.textTertiary,
  },
  headerTitle: {
    fontSize: 42,
    fontWeight: "800",
    lineHeight: 44,
    color: colors.text,
  },
  todayPreviewCard: {
    gap: spacing.lg,
  },
  todayPreviewHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
  },
  todayPreviewCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  todayPreviewTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.text,
  },
  todayPreviewImageFrame: {
    width: 112,
    height: 112,
    borderRadius: 28,
    borderCurve: "continuous",
    backgroundColor: colors.primarySoft,
    overflow: "hidden",
  },
  todayPreviewImage: {
    width: "100%",
    height: "100%",
  },
  todayPreviewMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  todayPreviewSets: {
    gap: spacing.sm,
  },
  todayPreviewSetsLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  workSetList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  workSetChip: {
    minWidth: 88,
    borderRadius: borderRadius.lg,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  workSetChipWeight: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  todayEmptyState: {
    gap: spacing.sm,
  },
  todayEmptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  reorderHint: {
    marginTop: -spacing.xs,
  },
  weekList: {
    position: "relative",
    gap: spacing.md,
  },
  weekRow: {
    zIndex: 0,
  },
  weekRowDragSource: {
    position: "absolute",
    left: 0,
    right: 0,
    opacity: 0,
  },
  floatingDraggedCard: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 20,
    opacity: 0.96,
    boxShadow: "0px 24px 60px rgba(0, 0, 0, 0.32)",
  },
  dropPlaceholder: {
    borderRadius: borderRadius.xl,
    borderCurve: "continuous",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: colors.surfaceMuted,
    opacity: 0.55,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  cardLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardMetaText: {
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 0,
  },
  thumbnailFrame: {
    width: 82,
    height: 82,
    borderRadius: 22,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: colors.surfaceMuted,
    flexShrink: 0,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  dragHandle: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: borderRadius.lg,
    borderCurve: "continuous",
    backgroundColor: colors.surfaceGlass,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minWidth: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  dragHandleRight: {
    marginLeft: spacing.xs,
  },
  dragHandleActive: {
    borderColor: "rgba(255, 255, 255, 0.14)",
    backgroundColor: colors.surfaceGlassStrong,
  },
  dragHandleText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "700",
    lineHeight: 16,
  },
  liftName: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  upcomingHeader: {
    gap: spacing.xs,
  },
  upcomingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  upcomingTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  chevron: {
    fontSize: 24,
    color: colors.textTertiary,
  },
});
