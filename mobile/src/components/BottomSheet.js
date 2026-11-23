import { View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { RADIUS } from '../theme/spacing';
import { MAX_WIDTH } from '../theme/layout';
import useResponsive from '../hooks/useResponsive';

// Lembar bawah di atas layar sebelumnya (dipakai layar modal transparan "Usulan pengganti").
// Ketuk area gelap untuk menutup.
export default function BottomSheet({ children, onClose }) {
  const insets = useSafeAreaInsets();
  const { gutter } = useResponsive();
  return (
    <View style={styles.root}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Tutup" accessibilityRole="button" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16, paddingHorizontal: gutter }]}>
        <View style={styles.handle} />
        <View style={styles.inner}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.overlay },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: 10,
    alignItems: 'center',
    maxHeight: '88%',
  },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: COLORS.border, marginBottom: 14 },
  inner: { width: '100%', maxWidth: MAX_WIDTH.form, gap: 12 },
});
