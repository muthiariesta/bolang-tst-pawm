import { View, StyleSheet } from 'react-native';
import AppText from './AppText';
import IconButton from './IconButton';
import { COLORS } from '../theme/colors';
import { RADIUS } from '../theme/spacing';

// Penambah/pengurang angka (Jumlah hari, Batas jam per hari).
export default function Stepper({ label, value, min = 1, max = 7, step = 1, onChange, format = (v) => String(v), error }) {
  return (
    <View style={styles.wrap}>
      {label ? (
        <AppText variant="label" color="textSecondary">
          {label}
        </AppText>
      ) : null}
      <View style={[styles.box, error ? { borderColor: COLORS.danger } : null]}>
        <IconButton name="remove" tone="soft" onPress={() => onChange(Math.max(min, value - step))} disabled={value <= min} accessibilityLabel={`Kurangi ${label || ''}`} />
        <AppText variant="title" accessibilityLiveRegion="polite">
          {format(value)}
        </AppText>
        <IconButton name="add" tone="primary" onPress={() => onChange(Math.min(max, value + step))} disabled={value >= max} accessibilityLabel={`Tambah ${label || ''}`} />
      </View>
      {error ? (
        <AppText variant="caption" color="danger">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
