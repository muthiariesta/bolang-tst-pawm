import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { SHADOW } from '../theme/spacing';
import { MAX_WIDTH } from '../theme/layout';
import useResponsive from '../hooks/useResponsive';

// Area tombol aksi yang menempel di bawah layar (sticky CTA), aman dari home indicator.
// Anak-anaknya disusun menyamping dan masing-masing mengisi lebar yang sama.
export default function BottomBar({ children, maxWidth = MAX_WIDTH.form, safeBottom = true }) {
  const insets = useSafeAreaInsets();
  const { gutter } = useResponsive();
  return (
    <View style={[styles.bar, { paddingBottom: (safeBottom ? insets.bottom : 0) + 14 }]}>
      <View style={[styles.row, { maxWidth, paddingHorizontal: gutter }]}>
        {Array.isArray(children)
          ? children.filter(Boolean).map((child, i) => (
              <View key={i} style={styles.cell}>
                {child}
              </View>
            ))
          : <View style={styles.cell}>{children}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: COLORS.card, paddingTop: 14, alignItems: 'center', ...SHADOW.nav },
  row: { width: '100%', flexDirection: 'row', gap: 10 },
  cell: { flex: 1 },
});
