import type { SetLogRecord, WorkoutResultRecord } from "@ownlift/db";
import { getSetLogsBySession, getWorkoutResultBySession } from "@ownlift/db";
import { Check, ChevronRight } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { borderRadius, Button, Card, colors, fontSize, fontWeight, spacing, Text } from "../../src/design";
import { formatNumber, getLiftLabel, getSessionLabel, t, useLocale } from "../../src/i18n";
import { useProgramStore } from "../../src/stores/program-store";

type ParticleConfig = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  rotate: number;
  delay: number;
  drift: number;
};

const PARTICLES: ParticleConfig[] = [
  { id: "p1", x: -138, y: -106, width: 10, height: 28, color: colors.primary, rotate: -148, delay: 0.02, drift: -18 },
  { id: "p2", x: -94, y: -154, width: 12, height: 12, color: "#FFFFFF", rotate: -122, delay: 0.08, drift: 12 },
  { id: "p3", x: -24, y: -176, width: 8, height: 24, color: "rgba(214, 255, 96, 0.72)", rotate: -42, delay: 0.12, drift: -10 },
  { id: "p4", x: 48, y: -164, width: 12, height: 12, color: "#FFFFFF", rotate: 28, delay: 0.04, drift: 16 },
  { id: "p5", x: 128, y: -112, width: 10, height: 30, color: colors.primary, rotate: 136, delay: 0.11, drift: -14 },
  { id: "p6", x: 156, y: -24, width: 14, height: 14, color: "rgba(255, 255, 255, 0.88)", rotate: 88, delay: 0.18, drift: 8 },
  { id: "p7", x: 132, y: 96, width: 10, height: 26, color: "rgba(214, 255, 96, 0.72)", rotate: 152, delay: 0.15, drift: -16 },
  { id: "p8", x: 46, y: 162, width: 12, height: 12, color: "#FFFFFF", rotate: 102, delay: 0.22, drift: 10 },
  { id: "p9", x: -42, y: 156, width: 8, height: 24, color: colors.primary, rotate: -102, delay: 0.2, drift: -12 },
  { id: "p10", x: -132, y: 84, width: 12, height: 12, color: "#FFFFFF", rotate: -138, delay: 0.14, drift: 14 },
  { id: "p11", x: -164, y: -8, width: 10, height: 30, color: "rgba(214, 255, 96, 0.72)", rotate: -92, delay: 0.24, drift: -8 },
  { id: "p12", x: 0, y: -138, width: 6, height: 18, color: "#FFFFFF", rotate: 0, delay: 0.06, drift: 0 },
];

function clamp(value: number, min: number, max: number): number {
  "worklet";
  return Math.min(Math.max(value, min), max);
}

function CelebrationRing({
  progress,
  phase,
  size,
  color,
}: {
  progress: SharedValue<number>;
  phase: number;
  size: number;
  color: string;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const normalized = (progress.value + phase) % 1;
    return {
      opacity: interpolate(normalized, [0, 0.7, 1], [0.52, 0.18, 0], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(normalized, [0, 1], [0.72, 1.28], Extrapolation.CLAMP) }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

function CelebrationParticle({
  progress,
  config,
}: {
  progress: SharedValue<number>;
  config: ParticleConfig;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const local = clamp((progress.value - config.delay) / 0.72, 0, 1);
    const arc = Math.sin(local * Math.PI) * config.drift;

    return {
      opacity: interpolate(local, [0, 0.08, 0.82, 1], [0, 1, 1, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: config.x * local + arc },
        { translateY: config.y * local - Math.sin(local * Math.PI) * 16 },
        { rotate: `${config.rotate * local}deg` },
        { scale: interpolate(local, [0, 0.18, 1], [0.24, 1, 0.88], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: config.width,
          height: config.height,
          borderRadius: config.height / 2,
          backgroundColor: config.color,
        },
        animatedStyle,
      ]}
    />
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Text variant="label" style={styles.metricLabel}>
        {label}
      </Text>
      <Text style={styles.metricValue}>
        {value}
      </Text>
    </View>
  );
}

export default function WorkoutCompleteScreen() {
  useLocale();

  const params = useLocalSearchParams<{ sessionId?: string | string[] }>();
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;
  const router = useRouter();
  const { instance, stubs, nextStub, loadProgram } = useProgramStore();

  const [result, setResult] = useState<WorkoutResultRecord | null>(null);
  const [logs, setLogs] = useState<SetLogRecord[]>([]);

  const stub = stubs.find((item) => item.sessionId === sessionId);
  const upcomingStub = nextStub && nextStub.sessionId !== sessionId ? nextStub : null;

  const introProgress = useSharedValue(0);
  const glowProgress = useSharedValue(0);
  const ringProgress = useSharedValue(0);
  const burstProgress = useSharedValue(0);

  useEffect(() => {
    void loadProgram();
  }, [loadProgram]);

  useEffect(() => {
    let isCancelled = false;

    async function loadSummary() {
      if (!sessionId) {
        return;
      }

      const [nextResult, nextLogs] = await Promise.all([
        getWorkoutResultBySession(sessionId),
        getSetLogsBySession(sessionId),
      ]);

      if (isCancelled) {
        return;
      }

      setResult(nextResult);
      setLogs(nextLogs);
    }

    void loadSummary();

    return () => {
      isCancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    introProgress.value = withSpring(1, {
      damping: 15,
      stiffness: 160,
      mass: 0.95,
    });
    glowProgress.value = withRepeat(
      withTiming(1, {
        duration: 1800,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );
    ringProgress.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 2400,
          easing: Easing.out(Easing.quad),
        }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
    );
    burstProgress.value = withTiming(1, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [burstProgress, glowProgress, introProgress, ringProgress]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: introProgress.value,
    transform: [
      {
        scale: interpolate(introProgress.value, [0, 1], [0.72, 1], Extrapolation.CLAMP),
      },
      {
        translateY: interpolate(introProgress.value, [0, 1], [26, 0], Extrapolation.CLAMP),
      },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowProgress.value, [0, 1], [0.22, 0.38], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(glowProgress.value, [0, 1], [0.94, 1.1], Extrapolation.CLAMP),
      },
    ],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(introProgress.value, [0.2, 1], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(introProgress.value, [0.2, 1], [18, 0], Extrapolation.CLAMP),
      },
    ],
  }));

  const goToPlan = () => {
    try {
      if (router.canDismiss()) {
        router.dismissTo("/(tabs)/plan");
        return;
      }

      if (router.canGoBack()) {
        router.back();
        return;
      }

      router.replace("/(tabs)/plan");
    } catch {
      router.replace("/(tabs)/plan");
    }
  };

  const viewSessionLog = () => {
    if (!sessionId) {
      goToPlan();
      return;
    }

    router.replace({
      pathname: "/session/[sessionId]",
      params: { sessionId },
    });
  };

  const completedSets = logs.filter((item) => item.isCompleted).length;
  const totalSets = logs.length;
  const liftLabel = stub ? getLiftLabel(stub.mainLiftKey) : null;
  const sessionLabel = stub ? getSessionLabel(stub.dayIndex) : null;
  const completedSetsValue = totalSets > 0 ? `${formatNumber(completedSets)} / ${formatNumber(totalSets)}` : "—";
  const volumeValue = result?.summary?.totalVolume != null && instance
    ? `${formatNumber(result.summary.totalVolume)} ${instance.params.unit}`
    : "—";
  const durationValue = result?.summary?.durationMinutes != null
    ? t("workout.completeScreen.durationValue", { minutes: formatNumber(result.summary.durationMinutes) })
    : "—";
  const nextUpLabel = upcomingStub
    ? `${getLiftLabel(upcomingStub.mainLiftKey)} · ${getSessionLabel(upcomingStub.dayIndex)}`
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.backgroundDeep, "#111722", "#172410"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.decorLayer}>
        <View style={styles.decorCircleTop} />
        <View style={styles.decorCircleBottom} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroBlock}>
          <Animated.View style={[styles.heroVisual, heroStyle]}>
            <CelebrationRing progress={ringProgress} phase={0} size={186} color="rgba(214, 255, 96, 0.26)" />
            <CelebrationRing progress={ringProgress} phase={0.38} size={236} color="rgba(255, 255, 255, 0.16)" />
            {PARTICLES.map((particle) => (
              <CelebrationParticle
                key={particle.id}
                progress={burstProgress}
                config={particle}
              />
            ))}
            <Animated.View style={[styles.heroGlow, glowStyle]} />
            <View style={styles.heroCore}>
              <View style={styles.heroCheckBadge}>
                <Check color={colors.primaryForeground} size={42} strokeWidth={3.2} />
              </View>
            </View>
          </Animated.View>

          <Animated.View style={[styles.heroCopy, contentStyle]}>
            <View style={styles.statusPill}>
              <Text variant="label" style={styles.statusPillText}>
                {t("status.completed")}
              </Text>
            </View>
            <Text style={styles.heroTitle}>
              {t("workout.completeScreen.title")}
            </Text>
            <Text style={styles.heroSubtitle}>
              {liftLabel
                ? t("workout.completeScreen.subtitle", { lift: liftLabel })
                : t("workout.completeScreen.subtitleFallback")}
            </Text>
            {sessionLabel ? (
              <Text variant="caption" style={styles.heroMeta}>
                {sessionLabel}
              </Text>
            ) : null}
          </Animated.View>
        </View>

        <Animated.View style={[styles.summarySection, contentStyle]}>
          <View style={styles.metricGrid}>
            <MetricCard
              label={t("workout.completeScreen.completedSets")}
              value={completedSetsValue}
            />
            <MetricCard
              label={t("workout.completeScreen.volume")}
              value={volumeValue}
            />
            <MetricCard
              label={t("workout.completeScreen.duration")}
              value={durationValue}
            />
          </View>

          {nextUpLabel ? (
            <Card>
              <View style={styles.nextCard}>
                <View>
                  <Text variant="label">{t("workout.completeScreen.nextUp")}</Text>
                  <Text style={styles.nextTitle}>
                    {nextUpLabel}
                  </Text>
                </View>
                <ChevronRight color={colors.textSecondary} size={18} />
              </View>
            </Card>
          ) : null}
        </Animated.View>

        <Animated.View style={[styles.actions, contentStyle]}>
          <Button
            title={t("workout.completeScreen.backToPlan")}
            onPress={goToPlan}
          />
          <Button
            title={t("workout.completeScreen.viewLog")}
            variant="secondary"
            onPress={viewSessionLog}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.backgroundDeep,
  },
  decorLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  decorCircleTop: {
    position: "absolute",
    top: -92,
    right: -52,
    width: 224,
    height: 224,
    borderRadius: 112,
    backgroundColor: "rgba(214, 255, 96, 0.08)",
    transform: [{ scale: 1.1 }],
  },
  decorCircleBottom: {
    position: "absolute",
    bottom: -84,
    left: -64,
    width: 248,
    height: 248,
    borderRadius: 124,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing["2xl"],
    paddingBottom: spacing["3xl"],
    justifyContent: "space-between",
    gap: spacing["2xl"],
  },
  heroBlock: {
    gap: spacing["2xl"],
    alignItems: "center",
    paddingTop: spacing["2xl"],
  },
  heroVisual: {
    width: 280,
    height: 280,
    alignItems: "center",
    justifyContent: "center",
  },
  heroGlow: {
    position: "absolute",
    width: 196,
    height: 196,
    borderRadius: 98,
    backgroundColor: "rgba(214, 255, 96, 0.2)",
  },
  heroCore: {
    width: 156,
    height: 156,
    borderRadius: 78,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(13, 18, 25, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(214, 255, 96, 0.2)",
  },
  heroCheckBadge: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.32,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  ring: {
    position: "absolute",
    borderWidth: 1,
  },
  particle: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -8,
    marginLeft: -8,
  },
  heroCopy: {
    alignItems: "center",
    gap: spacing.md,
    maxWidth: 320,
  },
  statusPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(214, 255, 96, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(214, 255, 96, 0.16)",
  },
  statusPillText: {
    color: colors.primary,
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: fontSize["4xl"],
    lineHeight: 42,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: fontSize.lg,
    lineHeight: 26,
    color: colors.textSecondary,
    textAlign: "center",
  },
  heroMeta: {
    color: "rgba(255, 255, 255, 0.72)",
  },
  summarySection: {
    gap: spacing.lg,
  },
  metricGrid: {
    gap: spacing.md,
  },
  metricCard: {
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: "rgba(20, 26, 35, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  metricLabel: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  metricValue: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  nextCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  nextTitle: {
    marginTop: spacing.xs,
    fontSize: fontSize.xl,
    lineHeight: 26,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  actions: {
    gap: spacing.sm,
  },
});
