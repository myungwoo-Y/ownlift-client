import { StyleSheet } from "react-native";
import { borderRadius, colors, spacing } from "../../design";
import { TAB_BAR_CLEARANCE } from "./constants";

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing["2xl"],
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
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
    letterSpacing: 0,
    textTransform: "none",
    color: colors.text,
  },
  sectionIconButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: colors.surfaceGlass,
  },
  sectionIconButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.96 }],
  },
  todayPreviewCard: {
    gap: spacing.lg,
  },
  todayPreviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  todayPreviewCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  todayPreviewTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.text,
  },
  todayPreviewSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  todayPreviewImageFrame: {
    width: 72,
    height: 72,
    borderRadius: 22,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  todayPreviewImage: {
    width: "100%",
    height: "100%",
  },
  todayPreviewSetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  todayPreviewSetCard: {
    flex: 1,
    minWidth: 92,
    borderRadius: borderRadius.xl,
    borderCurve: "continuous",
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  todayPreviewSetCardAccent: {
    backgroundColor: colors.primarySoft,
  },
  todayPreviewSetWeight: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  todayPreviewSetWeightAccent: {
    color: colors.text,
  },
  todayPreviewSetUnit: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  todayPreviewSetReps: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  todayPreviewSetRepsAccent: {
    color: colors.primary,
  },
  todayPreviewInfoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  todayPreviewInfoPill: {
    flex: 1,
    minWidth: 92,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  todayPreviewInfoText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  todayPreviewCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
    gap: spacing.sm,
    borderRadius: borderRadius.full,
    borderCurve: "continuous",
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing["2xl"],
  },
  todayPreviewCtaPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  todayPreviewCtaText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primaryForeground,
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
  reorderIntroCard: {
    gap: spacing.sm,
  },
  reorderIntroText: {
    color: colors.textSecondary,
  },
  weekCarouselContent: {
    gap: spacing.md,
    paddingLeft: spacing["2xl"],
    paddingRight: spacing["2xl"],
  },
  weekCarouselViewport: {
    marginHorizontal: -spacing["2xl"],
  },
  weekCarouselCard: {
    minHeight: 212,
    justifyContent: "space-between",
    gap: spacing["3xl"],
    borderRadius: 28,
    borderCurve: "continuous",
    borderWidth: 1,
    padding: spacing.lg,
    boxShadow: "0px 22px 44px rgba(0, 0, 0, 0.18)",
  },
  weekCarouselCardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.985 }],
  },
  weekCarouselCardToday: {
    borderColor: "rgba(214, 255, 96, 0.52)",
  },
  weekCarouselCardCompleted: {
    opacity: 0.76,
  },
  weekCarouselCardSquat: {
    backgroundColor: colors.surfaceElevated,
    borderColor: "rgba(146, 180, 245, 0.12)",
  },
  weekCarouselCardBench: {
    backgroundColor: colors.surfaceElevated,
    borderColor: "rgba(228, 134, 116, 0.12)",
  },
  weekCarouselCardDeadlift: {
    backgroundColor: colors.surfaceElevated,
    borderColor: "rgba(117, 180, 194, 0.12)",
  },
  weekCarouselCardPress: {
    backgroundColor: colors.surfaceElevated,
    borderColor: "rgba(157, 207, 100, 0.12)",
  },
  weekCarouselTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  weekCarouselThumbnailFrame: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderCurve: "continuous",
    overflow: "hidden",
    padding: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  weekCarouselThumbnailSquat: {
    backgroundColor: "rgba(146, 180, 245, 0.12)",
  },
  weekCarouselThumbnailBench: {
    backgroundColor: "rgba(228, 134, 116, 0.12)",
  },
  weekCarouselThumbnailDeadlift: {
    backgroundColor: "rgba(117, 180, 194, 0.12)",
  },
  weekCarouselThumbnailPress: {
    backgroundColor: "rgba(157, 207, 100, 0.12)",
  },
  weekCarouselBody: {
    gap: spacing.sm,
  },
  weekCarouselMetaLight: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(245, 245, 247, 0.62)",
  },
  weekCarouselMetaDark: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(245, 245, 247, 0.62)",
  },
  weekCarouselTitleLight: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: "#FAFAFB",
  },
  weekCarouselTitleDark: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: "#FAFAFB",
  },
  weekCarouselSummaryLight: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
    color: "rgba(245, 245, 247, 0.78)",
  },
  weekCarouselSummaryDark: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
    color: "rgba(245, 245, 247, 0.78)",
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
    width: 68,
    height: 68,
    borderRadius: 18,
    borderCurve: "continuous",
    overflow: "hidden",
    padding: spacing.xs,
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
