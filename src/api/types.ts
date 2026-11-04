export interface AnimeItem {
  title: string;
  image?: string | null;
  /** URL del anime en el proveedor; la API la usa como identificador. */
  url: string;
  slug?: string;
  provider?: string;
}

export interface Genre {
  id?: number | null;
  name: string;
  slug?: string | null;
}

export interface Episode {
  number: number;
  url: string;
  title?: string;
}

export interface AnimeInfo {
  title: string;
  image?: string | null;
  description?: string | null;
  type?: string | null;
  url: string;
  genres: Genre[];
  episodes: Episode[];
}

export interface VideoServer {
  server: string;
  url: string;
}

export interface EpisodeServers {
  sub: VideoServer[];
  dub: VideoServer[];
}

export interface ResolvedStream {
  server: string;
  mediaType: 'hls' | 'mp4';
  streamUrl: string;
}

export interface CatalogPage {
  results: AnimeItem[];
  hasMore: boolean;
}
