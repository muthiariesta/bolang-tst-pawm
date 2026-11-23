import { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import AppText from './AppText';
import Icon from './Icon';
import { COLORS, getTone } from '../theme/colors';
import { RADIUS } from '../theme/spacing';

// Komponen Figma "Chip/Default" & "Chip/Selected".
// tone (opsional) memberi warna lembut saat tidak terpilih, mis. chip contoh di Rencana Ajaib.
function Chip({ label, selected = false, onPress, icon, tone, disabled, testID }) {
  const t = tone ? getTone(tone) : null;
  const bg = selected ? COLORS.primary : t ? t.bg : COLORS.card;
  const fg = selected ? COLORS.white : t ? t.fg : COLORS.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: bg },
        !selected && !t ? styles.outline : null,
        pressed ? { opacity: 0.8 } : null,
        disabled ? { opacity: 0.4 } : null,
      ]}
    >
      {icon ? <Icon name={icon} size={16} color={fg} /> : null}
      <AppText variant="label" color={fg} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    minHeight: 38,
    borderRadius: RADIUS.pill,
  },
  outline: { borderWidth: 1, borderColor: COLORS.border },
});

export default memo(Chip);
