import { ScrollView, Pressable, View, StyleSheet } from 'react-native';
import AppText from './AppText';
import { COLORS } from '../theme/colors';
import { RADIUS } from '../theme/spacing';
import { addDays, dayNameShort, dayOfMonth, formatDateShort } from '../utils/format';

// Pemilih tanggal horizontal: hari ini s.d. N hari ke depan (batas prakiraan cuaca /weather = 15 hari).
// Tidak butuh library date picker tambahan.
export default function DateStrip({ label, value, onChange, from, days = 16, error }) {
  const dates = Array.from({ length: days }, (_, i) => addDays(from, i));
  return (
    <View style={styles.wrap}>
      {label ? (
        <AppText variant="label" color="textSecondary">
          {label}
        </AppText>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} style={styles.scroll}>
        {dates.map((iso, i) => {
          const active = iso === value;
          return (
            <Pressable
              key={iso}
              onPress={() => onChange(iso)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={formatDateShort(iso)}
              style={[styles.cell, active ? styles.active : null]}
            >
              <AppText variant="caption" color={active ? 'white' : 'muted'}>
                {i === 0 ? 'Hari ini' : dayNameShort(iso)}
              </AppText>
              <AppText variant="h3" color={active ? 'white' : 'text'}>
                {dayOfMonth(iso)}
              </AppText>
              <AppText variant="caption" color={active ? 'white' : 'muted'}>
                {formatDateShort(iso).split(' ')[1]}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
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
  scroll: { flexGrow: 0 },
  row: { gap: 8 },
  cell: {
    width: 62,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  active: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
});
