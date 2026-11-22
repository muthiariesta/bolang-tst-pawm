import { View, Pressable, StyleSheet } from 'react-native';
import AppText from './AppText';
import Icon from './Icon';
import { COLORS } from '../theme/colors';
import { RADIUS } from '../theme/spacing';

// Pilihan tunggal berbentuk segmen (Mode perjalanan, Masuk/Daftar).
// options: [{ key, label, icon?, iconSet? }]
export default function Segmented({ options, value, onChange, pill = false, style }) {
  return (
    <View style={[styles.wrap, pill ? styles.pillWrap : null, style]} accessibilityRole="radiogroup">
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            testID={`seg-${o.key}`}
            style={[styles.option, pill ? styles.pillOption : null, active ? styles.active : null]}
          >
            {o.icon ? <Icon name={o.icon} set={o.iconSet} size={18} color={active ? 'white' : 'textSecondary'} /> : null}
            <AppText variant="label" color={active ? 'white' : 'textSecondary'} numberOfLines={1}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillWrap: { alignSelf: 'center', borderRadius: RADIUS.pill, borderWidth: 0, backgroundColor: 'transparent', gap: 8 },
  option: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12 },
  pillOption: { flex: 0, paddingHorizontal: 18, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  active: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
});
