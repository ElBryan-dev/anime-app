import type {
  AnimeInfo,
  AnimeItem,
  CatalogPage,
  Episode,
  EpisodeServers,
  Genre,
  ResolvedStream,
  VideoServer,
} from './types';

const API_PREFIX = '/api/v1/anime';

/** Servidores para los que el backend tiene resolutor nativo (ver README de la API). */
const RESOLVABLE = ['voe', 'wish', 'tape', 'playnix', 'medix', 'awish'];

export function isResolvable(server: VideoServer): boolean {
  const haystack = `${server.server ?? ''} ${server.url ?? ''}`.toLowerCase();
  return RESOLVABLE.some((key) => haystack.includes(key));
}

function asArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export class ApiClient {
  readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.trim().replace(/\/+$/, '');
    this.apiKey = apiKey.trim();
  }

  get configured(): boolean {
    return this.baseUrl.length > 0;
  }

  /** Las portadas pasan por el proxy de imágenes del backend para evitar bloqueos de hotlink. */
  imageUrl(image?: string | null): string | undefined {
    if (!image) return undefined;
    return `${this.baseUrl}${API_PREFIX}/image-proxy?url=${encodeURIComponent(image)}`;
  }

  private async request<T = any>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
    if (!this.configured) {
      throw new Error('Configura la URL de tu API en Ajustes.');
    }

    const query = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&');

    const url = `${this.baseUrl}${API_PREFIX}${path}${query ? `?${query}` : ''}`;

    let response: Response;
    try {
      response = await fetch(url, { headers: { 'x-api-key': this.apiKey } });
    } catch {
      throw new Error('No se pudo conectar con la API. Revisa la URL y tu conexión.');
    }

    let body: any = null;
    try {
      body = await response.json();
    } catch {
      // cuerpo no JSON
    }

    if (!response.ok || (body && body.success === false)) {
      throw new Error(body?.message || `Error ${response.status} al contactar con la API`);
    }
    return body as T;
  }

  private normalizeItem(raw: any): AnimeItem {
    return {
      title: String(raw?.title ?? 'Sin título'),
      image: raw?.image ?? null,
      url: String(raw?.url ?? raw?.slug ?? ''),
      slug: raw?.slug,
      provider: raw?.provider,
    };
  }

  async catalog(page = 1, genre?: string): Promise<CatalogPage> {
    const body = await this.request('/catalog', { page, genre });
    const results = asArray(body?.data?.results).map((item) => this.normalizeItem(item));
    return { results: results.filter((item) => item.url), hasMore: Boolean(body?.data?.hasMore) };
  }

  async search(query: string): Promise<AnimeItem[]> {
    const body = await this.request('/search', { q: query });
    return asArray(body?.data?.results)
      .map((item) => this.normalizeItem(item))
      .filter((item) => item.url);
  }

  async info(url: string): Promise<AnimeInfo> {
    const body = await this.request('/info', { url });
    const data = body?.data ?? {};

    const genres: Genre[] = asArray(data.genres)
      .map((genre: any) => (typeof genre === 'string' ? { name: genre } : { id: genre?.id, name: genre?.name, slug: genre?.slug }))
      .filter((genre: Genre) => Boolean(genre.name));

    const episodes: Episode[] = asArray(data.episodes)
      .map((ep: any) => ({
        number: Number(ep?.number),
        url: String(ep?.url ?? ''),
        title: ep?.title,
      }))
      .filter((ep) => Number.isFinite(ep.number) && ep.url)
      .sort((a, b) => a.number - b.number);

    return {
      title: String(data.title ?? 'Sin título'),
      image: data.image ?? null,
      description: data.description ?? null,
      type: data.type ?? null,
      url: String(data.url ?? url),
      genres,
      episodes,
    };
  }

  async episodeServers(url: string): Promise<EpisodeServers> {
    const body = await this.request('/episode', { url });
    const servers = body?.data?.servers ?? {};
    const clean = (list: unknown): VideoServer[] =>
      asArray(list)
        .map((s: any) => ({ server: String(s?.server ?? 'servidor'), url: String(s?.url ?? '') }))
        .filter((s) => s.url);
    return { sub: clean(servers.sub), dub: clean(servers.dub) };
  }

  /** Pide al backend resolver varias URLs de embed; devuelve el primer servidor que responda. */
  async resolve(urls: string[]): Promise<ResolvedStream> {
    const body = await this.request('/resolve', { urls: JSON.stringify(urls) });
    if (!body?.streamUrl) {
      throw new Error('No se pudo obtener el enlace directo.');
    }
    return {
      server: String(body.server ?? 'desconocido'),
      mediaType: body.mediaType === 'hls' ? 'hls' : 'mp4',
      streamUrl: String(body.streamUrl),
    };
  }
}
