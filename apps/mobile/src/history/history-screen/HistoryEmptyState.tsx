import { Card, Text } from "../../design";
import { t } from "../../i18n";
import { styles } from "./styles";

interface HistoryEmptyStateProps {
  itemCount: number;
  hasActiveFilters: boolean;
}

export function HistoryEmptyState({
  itemCount,
  hasActiveFilters,
}: HistoryEmptyStateProps) {
  const title = itemCount === 0
    ? t("history.emptyTitle")
    : hasActiveFilters
      ? t("history.filteredEmptyTitle")
      : t("history.emptyTitle");
  const subtitle = itemCount === 0
    ? t("history.emptySubtitle")
    : hasActiveFilters
      ? t("history.filteredEmptySubtitle")
      : t("history.emptySubtitle");

  return (
    <Card style={styles.emptyCard}>
      <Text style={styles.emptyText} variant="body">
        {title}
      </Text>
      <Text style={styles.emptyText} variant="caption">
        {subtitle}
      </Text>
    </Card>
  );
}
