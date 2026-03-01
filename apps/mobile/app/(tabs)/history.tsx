import type { SessionStubRecord } from "@ownlift/db";
import { getWorkoutResultBySession } from "@ownlift/db";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge, colors, Divider, spacing, Text } from "../../src/design";
import { formatDate as formatLocaleDate, formatNumber, getLiftLabel, getSessionLabel, getWeekLabel, t, useLocale } from "../../src/i18n";
import { useProgramStore } from "../../src/stores/program-store";

function formatHistoryDate(dateStr: string | null): { day: string; weekday: string } {
  if (!dateStr) return { day: "", weekday: "" };
  const d = new Date(dateStr);
  const day = formatLocaleDate(d, { month: "short", day: "numeric" });
  const weekday = formatLocaleDate(d, { weekday: "long" });
  return { day, weekday };
}

interface HistoryItem extends SessionStubRecord {
  completedAt?: string;
  totalVolume?: number;
}

export default function HistoryScreen() {
  useLocale();

  const router = useRouter();
  const { stubs, instance } = useProgramStore();
  const [items, setItems] = useState<HistoryItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const completedStubs = stubs.filter((s) => s.status === "completed");
        const enriched: HistoryItem[] = [];

        for (const stub of completedStubs) {
          const result = await getWorkoutResultBySession(stub.sessionId);
          enriched.push({
            ...stub,
            completedAt: result?.completedAt,
            totalVolume: result?.summary?.totalVolume ?? undefined,
          });
        }

        // Sort by completedAt descending
        enriched.sort((a, b) => {
          if (!a.completedAt || !b.completedAt) return 0;
          return b.completedAt.localeCompare(a.completedAt);
        });

        setItems(enriched);
      }

      void load();
    }, [stubs]),
  );

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const { day, weekday } = formatHistoryDate(item.completedAt ?? null);
    const weekLabel = getWeekLabel(item.weekIndex);
    const sessionLabel = getSessionLabel(item.dayIndex);

    return (
      <Pressable
        onPress={() => router.push(`/session/${item.sessionId}`)}
      >
        <View style={styles.historyItem}>
          <View style={styles.dateColumn}>
            <Text style={styles.dateDay}>{day}</Text>
            <Text variant="caption">{weekday}</Text>
          </View>
          <View style={styles.detailColumn}>
            <View style={styles.titleRow}>
              <Text style={styles.liftName}>
                {getLiftLabel(item.mainLiftKey)}
              </Text>
              <View style={styles.badges}>
                <Badge variant="amrap" label={t("badge.amrap")} />
              </View>
            </View>
            <Text variant="caption">
              {sessionLabel} · {t("week.title", { week: item.weekIndex + 1 })} · {weekLabel}
            </Text>
            {item.totalVolume ? (
              <Text variant="caption">
                {t("history.volume", { volume: formatNumber(item.totalVolume), unit: instance?.params.unit ?? "kg" })}
              </Text>
            ) : null}
          </View>
        </View>
        <Divider />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text variant="title">{t("history.title")}</Text>
      </View>
      <Divider />
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="body">{t("history.emptyTitle")}</Text>
          <Text variant="caption">{t("history.emptySubtitle")}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.sessionId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing["3xl"],
    paddingBottom: spacing.lg,
  },
  list: {
    paddingHorizontal: spacing["2xl"],
  },
  historyItem: {
    flexDirection: "row",
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  dateColumn: {
    width: 72,
    gap: 2,
  },
  dateDay: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
  },
  detailColumn: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  liftName: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  badges: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing["3xl"],
  },
});
