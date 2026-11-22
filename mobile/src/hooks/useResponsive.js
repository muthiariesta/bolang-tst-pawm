import { useWindowDimensions } from 'react-native';
import { BREAKPOINTS, MAX_WIDTH } from '../theme/layout';

// Membaca lebar layar saat ini (ikut berubah saat HP diputar / jendela web diubah).
export default function useResponsive() {
  const { width, height, fontScale } = useWindowDimensions();
  const isWide = width >= BREAKPOINTS.wide;
  const isTablet = width >= BREAKPOINTS.tablet;
  const isLandscape = width > height;
  const gutter = isTablet ? 28 : 20;

  // Jumlah kolom grid: HP 1–2, layar lebar 2–3, tablet 3–4
  const columns = (phone = 1, wide = 2, tablet = 3) => (isTablet ? tablet : isWide ? wide : phone);

  // Lebar konten setelah dibatasi MAX_WIDTH
  const contentWidth = (max = MAX_WIDTH.content) => Math.min(width, max);

  return { width, height, fontScale, isWide, isTablet, isLandscape, gutter, columns, contentWidth };
}
