import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { useSettings } from '../state/SettingsContext';
import { colors, spacing } from '../theme';

export function SettingsScreen() {
  const { apiUrl, apiKey, save } = useSettings();
  const [url, setUrl] = useState(apiUrl);
  const [key, setKey] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  const onSave = async () => {
    await save({ apiUrl: url.trim(), apiKey: key.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>URL de tu API</Text>
      <TextInput
        style={styles.input}
        value={url}
        onChangeText={setUrl}
        placeholder="https://mi-api.onrender.com"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />
      <Text style={styles.hint}>
        Emulador de Android con la API en tu PC: http://10.0.2.2:3000. Teléfono en tu red local: http://IP-de-tu-PC:3000.
      </Text>

      <Text style={styles.label}>API Key</Text>
      <TextInput
        style={styles.input}
        value={key}
        onChangeText={setKey}
        placeholder="dev-anime1v-key"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text style={styles.hint}>Debe coincidir con una de las claves de API_KEYS en el .env de tu servidor.</Text>

      <Pressable style={styles.button} onPress={onSave} accessibilityRole="button">
        <Text style={styles.buttonText}>{saved ? 'Guardado ✓' : 'Guardar'}</Text>
      </Pressable>

      <Text style={styles.credit}>
        Motor de scraping: anime1v-api, creado por FxxMorgan (github.com/FxxMorgan/anime1v-api).
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.sm, maxWidth: 640, width: '100%', alignSelf: 'center' },
  label: { color: colors.text, fontWeight: '700', marginTop: spacing.md },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hint: { color: colors.muted, fontSize: 12 },
  button: { backgroundColor: colors.accent, borderRadius: 10, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  buttonText: { color: '#fff', fontWeight: '700' },
  credit: { color: colors.muted, fontSize: 12, marginTop: spacing.xl, textAlign: 'center' },
});
