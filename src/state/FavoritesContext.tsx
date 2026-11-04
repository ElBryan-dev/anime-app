import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AnimeItem } from '../api/types';

const STORAGE_KEY = 'favorites:v1';

interface FavoritesContextValue {
  favorites: AnimeItem[];
  isFavorite: (url: string) => boolean;
  toggle: (item: AnimeItem) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<AnimeItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setFavorites(JSON.parse(raw));
      })
      .catch(() => undefined);
  }, []);

  const persist = (list: AnimeItem[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list)).catch(() => undefined);
  };

  const toggle = useCallback((item: AnimeItem) => {
    setFavorites((current) => {
      const exists = current.some((fav) => fav.url === item.url);
      const next = exists ? current.filter((fav) => fav.url !== item.url) : [item, ...current];
      persist(next);
      return next;
    });
  }, []);

  const value = useMemo<FavoritesContextValue>(
    () => ({ favorites, toggle, isFavorite: (url: string) => favorites.some((fav) => fav.url === url) }),
    [favorites, toggle],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites debe usarse dentro de FavoritesProvider');
  return ctx;
}
