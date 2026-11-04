import React from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { AnimeItem } from '../api/types';
import { useSettings } from '../state/SettingsContext';
import { colors, spacing, useGrid } from '../theme';

interface Props {
  items: AnimeItem[];
  onPress: (item: AnimeItem) => void;
  onEndReached?: () => void;
  loadingMore?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  header?: React.ReactElement | null;
}

export function AnimeGrid({ items, onPress, onEndReached, loadingMore, refreshing, onRefresh, header }: Props) {
  const { api } = useSettings();
  const { columns, cardWidth, gap, padding } = useGrid();

  return (
    <FlatList
      // Cambiar la key fuerza el re-render cuando cambia el número de columnas (rotación, plegables).
      key={columns}
      data={items}
      numColumns={columns}
      keyExtractor={(item, index) => `${item.url}-${index}`}
      ListHeaderComponent={header}
      contentContainerStyle={{ padding, paddingBottom: spacing.xl * 2 }}
      columnWrapperStyle={columns > 1 ? { gap, marginBottom: gap } : undefined}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.6}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color={colors.accent} /> : null}
      renderItem={({ item }) => {
        const uri = api.imageUrl(item.image);
        return (
          <Pressable
            onPress={() => onPress(item)}
            style={{ width: cardWidth }}
            accessibilityRole="button"
            accessibilityLabel={item.title}
          >
            {uri ? (
              <Image source={{ uri }} style={[styles.poster, { width: cardWidth, height: cardWidth * 1.45 }]} />
            ) : (
              <View style={[styles.poster, styles.placeholder, { width: cardWidth, height: cardWidth * 1.45 }]}>
                <Text style={styles.placeholderText} numberOfLines={4}>
                  {item.title}
                </Text>
              </View>
            )}
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  poster: { borderRadius: 10, backgroundColor: colors.surfaceAlt },
  placeholder: { alignItems: 'center', justifyContent: 'center', padding: spacing.sm },
  placeholderText: { color: colors.muted, textAlign: 'center', fontSize: 12 },
  title: { color: colors.text, marginTop: spacing.xs, fontSize: 13, fontWeight: '600' },
  footer: { marginVertical: spacing.lg },
});
