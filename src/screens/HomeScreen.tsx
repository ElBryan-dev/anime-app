import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AnimeItem } from '../api/types';
import { AnimeGrid } from '../components/AnimeGrid';
import { EmptyView, ErrorView, Loading } from '../components/StateViews';
import type { RootStackParamList, TabParamList } from '../navigation/types';
import { useSettings } from '../state/SettingsContext';
import { colors, spacing } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

const GENRES: { label: string; slug: string }[] = [
  { label: 'Todos', slug: '' },
  { label: 'Acción', slug: 'accion' },
  { label: 'Aventura', slug: 'aventura' },
  { label: 'Comedia', slug: 'comedia' },
  { label: 'Drama', slug: 'drama' },
  { label: 'Fantasía', slug: 'fantasia' },
  { label: 'Romance', slug: 'romance' },
  { label: 'Sci-Fi', slug: 'sci-fi' },
  { label: 'Sobrenatural', slug: 'sobrenatural' },
  { label: 'Shounen', slug: 'shounen' },
  { label: 'Seinen', slug: 'seinen' },
  { label: 'Mecha', slug: 'mecha' },
  { label: 'Terror', slug: 'terror' },
  { label: 'Misterio', slug: 'misterio' },
  { label: 'Recuentos', slug: 'recuentos-de-la-vida' },
  { label: 'Ecchi', slug: 'ecchi' },
];

export function HomeScreen({ navigation }: Props) {
  const { api, ready } = useSettings();
  const [genre, setGenre] = useState('');
  const [items, setItems] = useState<AnimeItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Evita que una respuesta antigua pise a una más reciente (cambio rápido de género).
  const requestId = useRef(0);

  const load = useCallback(
    async (targetPage: number, targetGenre: string, replace: boolean) => {
      const id = ++requestId.current;
      replace ? setLoading(true) : setLoadingMore(true);
      setError(null);
      try {
        const result = await api.catalog(targetPage, targetGenre || undefined);
        if (id !== requestId.current) return;
        setItems((current) => (replace ? result.results : [...current, ...result.results]));
        setHasMore(result.hasMore);
        setPage(targetPage);
      } catch (e) {
        if (id !== requestId.current) return;
        setError(e instanceof Error ? e.message : 'Error desconocido');
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [api],
  );

  useEffect(() => {
    if (ready && api.configured) {
      setItems([]);
      load(1, genre, true);
    }
  }, [ready, api, genre, load]);

  if (!ready) return <Loading />;

  if (!api.configured) {
    return (
      <View style={styles.setup}>
        <Text style={styles.setupTitle}>Conecta tu API</Text>
        <Text style={styles.setupText}>
          Esta app necesita la URL de tu servidor anime1v-api (por ejemplo https://mi-api.onrender.com).
        </Text>
        <Pressable style={styles.setupButton} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.setupButtonText}>Ir a Ajustes</Text>
        </Pressable>
      </View>
    );
  }

  const header = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {GENRES.map((g) => {
        const active = g.slug === genre;
        return (
          <Pressable
            key={g.slug || 'all'}
            onPress={() => setGenre(g.slug)}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{g.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {loading && items.length === 0 ? (
        <>
          {header}
          <Loading label="Cargando catálogo..." />
        </>
      ) : error && items.length === 0 ? (
        <>
          {header}
          <ErrorView message={error} onRetry={() => load(1, genre, true)} />
        </>
      ) : items.length === 0 ? (
        <>
          {header}
          <EmptyView message="No hay resultados para este género." />
        </>
      ) : (
        <AnimeGrid
          items={items}
          header={header}
          loadingMore={loadingMore}
          refreshing={loading}
          onRefresh={() => load(1, genre, true)}
          onEndReached={() => {
            if (hasMore && !loadingMore && !loading) load(page + 1, genre, false);
          }}
          onPress={(item) => navigation.navigate('Detail', { item })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  chips: { gap: spacing.sm, paddingBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.muted, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  setup: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  setupTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  setupText: { color: colors.muted, textAlign: 'center', maxWidth: 420 },
  setupButton: { backgroundColor: colors.accent, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 10 },
  setupButtonText: { color: '#fff', fontWeight: '700' },
});
