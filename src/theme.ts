import { useWindowDimensions } from 'react-native';

export const colors = {
  bg: '#0b0b12',
  surface: '#161622',
  surfaceAlt: '#1f1f2e',
  border: '#2a2a3d',
  text: '#f2f2f7',
  muted: '#9a9ab0',
  accent: '#8b5cf6',
  danger: '#ef4444',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

/** Número de columnas según el ancho: sirve para móviles, plegables y tablets. */
export function useGrid(minCardWidth = 150, gap = spacing.md, padding = spacing.lg) {
  const { width } = useWindowDimensions();
  const columns = Math.max(2, Math.min(8, Math.floor((width - padding * 2 + gap) / (minCardWidth + gap))));
  const cardWidth = (width - padding * 2 - gap * (columns - 1)) / columns;
  return { columns, cardWidth, gap, padding, width };
}

export function useIsWide() {
  const { width } = useWindowDimensions();
  return width >= 900;
}
