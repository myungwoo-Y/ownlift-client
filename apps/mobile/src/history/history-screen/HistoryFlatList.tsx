import type { ReactNode } from "react";
import { Children, isValidElement } from "react";
import { FlatList, View } from "react-native";
import type { ListRenderItem } from "react-native";
import { styles } from "./styles";
import type { HistoryItem } from "./types";

interface HistoryFlatListProps {
  data: HistoryItem[];
  keyExtractor: (item: HistoryItem) => string;
  renderItem: ListRenderItem<HistoryItem>;
  children?: ReactNode;
}

interface HistoryFlatListSlotProps {
  children: ReactNode;
}

function HistoryFlatListHeaderSlot({
  children,
}: HistoryFlatListSlotProps) {
  return <>{children}</>;
}

function HistoryFlatListEmptySlot({
  children,
}: HistoryFlatListSlotProps) {
  return <>{children}</>;
}

function HistoryFlatListRoot({
  data,
  keyExtractor,
  renderItem,
  children,
}: HistoryFlatListProps) {
  let headerContent: ReactNode = null;
  let emptyContent: ReactNode = null;

  Children.forEach(children, (child) => {
    if (!isValidElement<HistoryFlatListSlotProps>(child)) return;

    if (child.type === HistoryFlatListHeaderSlot) {
      headerContent = child.props.children;
    }

    if (child.type === HistoryFlatListEmptySlot) {
      emptyContent = child.props.children;
    }
  });

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.listContent}
      data={data}
      keyExtractor={keyExtractor}
      ListEmptyComponent={
        emptyContent
          ? () => (
            <View style={styles.empty}>
              {emptyContent}
            </View>
          )
          : null
      }
      ListHeaderComponent={headerContent ? () => <>{headerContent}</> : null}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      style={styles.safe}
    />
  );
}

export const HistoryFlatList = Object.assign(HistoryFlatListRoot, {
  Header: HistoryFlatListHeaderSlot,
  Empty: HistoryFlatListEmptySlot,
});
