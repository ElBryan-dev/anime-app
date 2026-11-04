import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiClient } from '../api/client';

const STORAGE_KEY = 'settings:v1';

interface Settings {
  apiUrl: string;
  apiKey: string;
}

interface SettingsContextValue extends Settings {
  ready: boolean;
  api: ApiClient;
  save: (next: Settings) => Promise<void>;
}

const DEFAULTS: Settings = {
  // 10.0.2.2 es el localhost del PC visto desde el emulador de Android.
  apiUrl: '',
  apiKey: 'dev-anime1v-key',
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
      } catch {
        // se usan los valores por defecto
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const save = useCallback(async (next: Settings) => {
    setSettings(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const api = useMemo(() => new ApiClient(settings.apiUrl, settings.apiKey), [settings.apiUrl, settings.apiKey]);

  const value = useMemo(() => ({ ...settings, ready, api, save }), [settings, ready, api, save]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings debe usarse dentro de SettingsProvider');
  return ctx;
}
