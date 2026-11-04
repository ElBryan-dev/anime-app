import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AnimeGrid } from '../components/AnimeGrid';
import { EmptyView } from '../components/StateViews';
import type { RootStackParamList, TabParamList } from '../navigation/types';
import { useFavorites } from '../state/FavoritesContext';
import { colors } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Favorites'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function FavoritesScreen({ navigation }: Props) {
  const { favorites } = useFavorites();

  return (
    <View style={styles.container}>
      {favorites.length === 0 ? (
        <EmptyView message="Aún no tienes favoritos. Abre un anime y pulsa ♥ para guardarlo." />
      ) : (
        <AnimeGrid items={favorites} onPress={(item) => navigation.navigate('Detail', { item })} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.bg } });
