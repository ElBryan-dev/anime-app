import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { isResolvable } from '../api/client';
import type { EpisodeServers, ResolvedStream, VideoServer } from '../api/types';
import type { RootStackParamList } from '../navigation/types';
import { useSettings } from '../state/SettingsContext';
import { colors, spacing, useIsWide } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Player'>;
type Variant = 'sub' | 'dub';

/** Extrae el host sin depender de `URL` (su soporte en React Native es parcial). */
function hostOf(url: string): string {
  const match = /^[a-z][a-z0-9+.-]*:\/\/([^/?#]+)/i.exec(url);
  return match ? match[1].toLowerCase() : '';
}

export function PlayerScreen({ route, navigation }: Props) {
  const { animeTitle, episodes } = route.params;
  const { api } = useSettings();
  const wide = useIsWide();

  const [index, setIndex] = useState(route.params.index);
  const [servers, setServers] = useState<EpisodeServers | null>(null);
  const [variant, setVariant] = useState<Variant>('sub');
  const [stream, setStream] = useState<ResolvedStream | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [activeServer, setActiveServer] = useState<string | null>(null);
  // Descarta respuestas de episodios/servidores que ya no son los actuales.
  const requestId = useRef(0);

  const episode = episodes[index];

  const player = useVideoPlayer(
    stream ? { uri: stream.streamUrl, contentType: stream.mediaType === 'hls' ? 'hls' : 'progressive' } : null,
    (p) => {
      p.play();
    },
  );

  useEffect(() => {
    navigation.setOptions({ title: `${animeTitle} · Ep ${episode.number}` });
  }, [navigation, animeTitle, episode.number]);

  /** Intenta enlace directo (reproductor nativo) y, si falla, usa el embed en un WebView. */
  const playFrom = useCallback(
    async (list: VideoServer[], id: number) => {
      setStatus('loading');
      setStream(null);
      setEmbedUrl(null);
      setActiveServer(null);

      if (list.length === 0) {
        setStatus('error');
        setMessage('No hay servidores disponibles para este episodio.');
        return;
      }

      const resolvable = list.filter(isResolvable);
      if (resolvable.length > 0) {
        try {
          const resolved = await api.resolve(resolvable.map((s) => s.url));
          if (id !== requestId.current) return;
          setStream(resolved);
          setActiveServer(resolved.server);
          setStatus('ready');
          return;
        } catch {
          if (id !== requestId.current) return;
        }
      }

      setEmbedUrl(list[0].url);
      setActiveServer(list[0].server);
      setStatus('ready');
    },
    [api],
  );

  const loadEpisode = useCallback(async () => {
    const id = ++requestId.current;
    setStatus('loading');
    setServers(null);
    setStream(null);
    setEmbedUrl(null);
    try {
      const result = await api.episodeServers(episode.url);
      if (id !== requestId.current) return;
      setServers(result);
      const initial: Variant = result.sub.length > 0 ? 'sub' : 'dub';
      setVariant(initial);
      await playFrom(result[initial], id);
    } catch (e) {
      if (id !== requestId.current) return;
      setStatus('error');
      setMessage(e instanceof Error ? e.message : 'Error desconocido');
    }
  }, [api, episode.url, playFrom]);

  useEffect(() => {
    loadEpisode();
  }, [loadEpisode]);

  const chooseVariant = (next: Variant) => {
    if (!servers || next === variant) return;
    setVariant(next);
    playFrom(servers[next], ++requestId.current);
  };

  const chooseServer = async (server: VideoServer) => {
    const id = ++requestId.current;
    setStatus('loading');
    setStream(null);
    setEmbedUrl(null);
    setActiveServer(server.server);
    if (isResolvable(server)) {
      try {
        const resolved = await api.resolve([server.url]);
        if (id !== requestId.current) return;
        setStream(resolved);
        setStatus('ready');
        return;
      } catch {
        if (id !== requestId.current) return;
      }
    }
    setEmbedUrl(server.url);
    setStatus('ready');
  };

  const list = servers ? servers[variant] : [];

  const video = (
    <View style={styles.videoBox}>
      {status === 'loading' ? (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.muted}>Buscando el mejor servidor...</Text>
        </View>
      ) : status === 'error' ? (
        <View style={styles.overlay}>
          <Text style={styles.muted}>{message}</Text>
          <Pressable style={styles.retry} onPress={loadEpisode}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : stream ? (
        <VideoView player={player} style={styles.video} nativeControls allowsFullscreen allowsPictureInPicture contentFit="contain" />
      ) : embedUrl ? (
        <WebView
          key={embedUrl}
          source={{ uri: embedUrl }}
          style={styles.video}
          allowsFullscreenVideo
          javaScriptEnabled
          mediaPlaybackRequiresUserAction={false}
          setSupportMultipleWindows={false}
          // Bloquea redirecciones y pop-ups publicitarios fuera del dominio del embed.
          onShouldStartLoadWithRequest={(req) => hostOf(req.url) === hostOf(embedUrl) || req.url === 'about:blank'}
        />
      ) : null}
    </View>
  );

  const controls = (
    <View style={styles.controls}>
      <View style={styles.row}>
        <Pressable
          style={[styles.navButton, index === 0 && styles.disabled]}
          disabled={index === 0}
          onPress={() => setIndex(index - 1)}
        >
          <Text style={styles.navText}>‹ Anterior</Text>
        </Pressable>
        <Text style={styles.epLabel}>Episodio {episode.number}</Text>
        <Pressable
          style={[styles.navButton, index === episodes.length - 1 && styles.disabled]}
          disabled={index === episodes.length - 1}
          onPress={() => setIndex(index + 1)}
        >
          <Text style={styles.navText}>Siguiente ›</Text>
        </Pressable>
      </View>

      {servers && servers.sub.length > 0 && servers.dub.length > 0 ? (
        <View style={styles.row}>
          {(['sub', 'dub'] as Variant[]).map((v) => (
            <Pressable key={v} style={[styles.pill, variant === v && styles.pillActive]} onPress={() => chooseVariant(v)}>
              <Text style={[styles.pillText, variant === v && styles.pillTextActive]}>{v === 'sub' ? 'Subtitulado' : 'Doblado'}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Text style={styles.section}>Servidores</Text>
      <View style={styles.wrap}>
        {list.map((s, i) => (
          <Pressable
            key={`${s.server}-${i}`}
            style={[styles.pill, activeServer === s.server && styles.pillActive]}
            onPress={() => chooseServer(s)}
          >
            <Text style={[styles.pillText, activeServer === s.server && styles.pillTextActive]}>{s.server}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>Episodios</Text>
      <View style={styles.wrap}>
        {episodes.map((ep, i) => (
          <Pressable key={`${ep.number}-${i}`} style={[styles.pill, i === index && styles.pillActive]} onPress={() => setIndex(i)}>
            <Text style={[styles.pillText, i === index && styles.pillTextActive]}>{ep.number}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  if (wide) {
    return (
      <View style={[styles.container, styles.wideLayout]}>
        <View style={styles.wideVideo}>{video}</View>
        <ScrollView style={styles.sidePanel}>{controls}</ScrollView>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      {video}
      {controls}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  wideLayout: { flexDirection: 'row' },
  wideVideo: { flex: 1, justifyContent: 'center' },
  sidePanel: { width: 360, borderLeftWidth: 1, borderLeftColor: colors.border },
  videoBox: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  video: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
  muted: { color: colors.muted, textAlign: 'center' },
  retry: { backgroundColor: colors.accent, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '700' },
  controls: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  epLabel: { color: colors.text, fontWeight: '700' },
  section: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: spacing.sm },
  navButton: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 10, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  disabled: { opacity: 0.35 },
  navText: { color: colors.text, fontWeight: '600' },
  pill: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  pillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  pillText: { color: colors.muted, fontWeight: '600' },
  pillTextActive: { color: '#fff' },
});
