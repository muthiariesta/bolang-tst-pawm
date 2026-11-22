import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from './AppText';
import IconButton from './IconButton';
import { COLORS } from '../theme/colors';
import { MAX_WIDTH } from '../theme/layout';
import useResponsive from '../hooks/useResponsive';

// Komponen Figma "Nav/AppBar".
// - Mode tab (large): judul besar H1 + subjudul, tanpa tombol kembali.
// - Mode stack: tombol kembali + judul H3 + subjudul + aksi kanan (opsional).
// Tombol kembali hanya muncul jika `onBack` dikirim. Jarak aman notch dari useSafeAreaInsets().
export default function HeaderBar({ title, subtitle, onBack, right, large = false, safeTop = true, transparent = false, maxWidth = MAX_WIDTH.list, style }) {
  const insets = useSafeAreaInsets();
  const { gutter } = useResponsive();
  return (
    <View
      style={[
        styles.bar,
        { paddingTop: (safeTop ? insets.top : 0) + (large ? 8 : 6), backgroundColor: transparent ? 'transparent' : COLORS.background },
        style,
      ]}
    >
      <View style={[styles.inner, { paddingHorizontal: large ? gutter : 16, maxWidth }]}>
        {onBack ? <IconButton name="chevron-back" onPress={onBack} accessibilityLabel="Kembali" /> : null}
        <View style={styles.titles}>
          <AppText variant={large ? 'h1' : 'h3'} numberOfLines={1} accessibilityRole="header">
            {title}
          </AppText>
          {subtitle ? (
            typeof subtitle === 'string' ? (
              <AppText variant="bodySm" color="muted" numberOfLines={1}>
                {subtitle}
              </AppText>
            ) : (
              subtitle
            )
          ) : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { width: '100%', alignItems: 'center', paddingBottom: 10 },
  inner: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12 },
  titles: { flex: 1, gap: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
