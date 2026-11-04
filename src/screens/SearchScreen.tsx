import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { AnimeItem } from '../api/types';
import { AnimeGrid } from '../components/AnimeGrid';
import { EmptyView, ErrorView, Loading } from '../components/StateViews';
import type { RootStackParamList, TabParamList } from '../navigation/types';
import { useSettings } from '../state/SettingsContext';
import { colors, spacing } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Search'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function SearchScreen({ navigation }: Props) {
  const { api } = useSettings();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AnimeItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const q = query.trim();
    if (!q) return;
    Keyboard.dismiss();
    setLoading(true);
    setError(null);
    try {
      setResults(await api.search(q));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={submit}
          placeholder="Buscar anime..."
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          autoCorrect={false}
        />
        <Pressable style={styles.button} onPress={submit} accessibilityRole="button">
          <Text style={styles.buttonText}>Buscar</Text>
        </Pressable>
      </View>

      {loading ? (
        <Loading label="Buscando en todos los proveedores..." />
      ) : error ? (
        <ErrorView message={error} onRetry={submit} />
      ) : results === null ? (
        <EmptyView message="Escribe el nombre de un anime y pulsa Buscar." />
      ) : results.length === 0 ? (
        <EmptyView message="Sin resultados." />
      ) : (
        <AnimeGrid items={results} onPress={(item) => navigation.navigate('Detail', { item })} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  bar: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: { backgroundColor: colors.accent, paddingHorizontal: spacing.lg, borderRadius: 10, justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
});
