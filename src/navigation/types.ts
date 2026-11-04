import type { AnimeItem, Episode } from '../api/types';

export type RootStackParamList = {
  Tabs: undefined;
  Detail: { item: AnimeItem };
  Player: { animeTitle: string; episodes: Episode[]; index: number };
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Favorites: undefined;
  Settings: undefined;
};
