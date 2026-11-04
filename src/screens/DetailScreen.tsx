import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AnimeInfo } from '../api/types';
import { ErrorView, Loading } from '../components/StateViews';
import type { RootStackParamList } from '../navigation/types';
import { useFavorites } from '../state/FavoritesContext';
import { useSettings } from '../state/SettingsContext';
import { colors, spacing, useIsWide } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Detail'>;

export function DetailScreen({ route, navigation }: Props) {
  const { item } = route.params;
  const { api } = useSettings();
  const { isFavorite, toggle } = useFavorites();
  const wide = useIsWide();
  const [info, setInfo] = useState<AnimeInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setInfo(null);
    try {
      setInfo(await api.info(item.url));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    }
  }, [api, item.url]);

  useEffect(() => {
    navigation.setOptions({ title: item.title });
    load();
  }, [navigation, item.title, load]);

  if (error) return <ErrorView message={error} onRetry={load} />;
  if (!info) return <Loading label="Cargando detalle..." />;

  const poster = api.imageUrl(info.image ?? item.image);
  const favorite = isFavorite(item.url);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.header, wide && styles.headerWide]}>
        {poster ? <Image source={{ uri: poster }} style={[styles.poster, wide && styles.posterWide]} /> : null}
        <View style={styles.headerText}>
          <Text style={styles.title}>{info.title}</Text>
          {info.type ? <Text style={styles.meta}>{info.type}</Text> : null}
          <View style={styles.genres}>
            {info.genres.map((g) => (
              <View key={g.name} style={styles.genre}>
                <Text style={styles.genreText}>{g.name}</Text>
              </View>
            ))}
          </View>
          <Pressable
            style={[styles.fav, favorite && styles.favActive]}
            onPress={() => toggle({ title: info.title, image: info.image ?? item.image, url: item.url })}
            accessibilityRole="button"
          >
            <Text style={styles.favText}>{favorite ? '♥ En favoritos' : '♡ Añadir a favoritos'}</Text>
          </Pressable>
          <Text style={styles.description}>{info.description || 'Sin sinopsis disponible.'}</Text>
        </View>
      </View>

      <Text style={styles.section}>Episodios ({info.episodes.length})</Text>
      {info.episodes.length === 0 ? (
        <Text style={styles.meta}>No hay episodios disponibles para ver online.</Text>
      ) : (
        <View style={styles.episodes}>
          {info.episodes.map((ep, index) => (
            <Pressable
              key={`${ep.number}-${ep.url}`}
              style={styles.episode}
              onPress={() => navigation.navigate('Player', { animeTitle: info.title, episodes: info.episodes, index })}
              accessibilityRole="button"
              accessibilityLabel={`Episodio ${ep.number}`}
            >
              <Text style={styles.episodeText}>Ep {ep.number}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2, maxWidth: 1200, alignSelf: 'center', width: '100%' },
  header: { gap: spacing.lg },
  headerWide: { flexDirection: 'row' },
  poster: { width: 160, height: 232, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignSelf: 'center' },
  posterWide: { width: 240, height: 348, alignSelf: 'flex-start' },
  headerText: { flex: 1, gap: spacing.sm },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  meta: { color: colors.muted },
  genres: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  genre: { backgroundColor: colors.surfaceAlt, borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  genreText: { color: colors.muted, fontSize: 12 },
  fav: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 10, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  favActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  favText: { color: colors.text, fontWeight: '700' },
  description: { color: colors.text, lineHeight: 21 },
  section: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: spacing.xl, marginBottom: spacing.md },
  episodes: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  episode: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 10, minWidth: 72, paddingVertical: spacing.md, alignItems: 'center' },
  episodeText: { color: colors.text, fontWeight: '700' },
});
