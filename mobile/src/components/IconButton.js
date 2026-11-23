import { Pressable, StyleSheet } from 'react-native';
import Icon from './Icon';
import { COLORS } from '../theme/colors';

// Tombol ikon bulat 40 dp (tombol kembali, bagikan, hapus).
// tone: 'light' (putih), 'soft' (abu muda), 'primary' (hijau), 'clear' (transparan)
const TONES = {
  light: { bg: COLORS.white, fg: COLORS.text },
  soft: { bg: COLORS.background, fg: COLORS.textSecondary },
  primary: { bg: COLORS.primary, fg: COLORS.white },
  accent: { bg: COLORS.accentSoft, fg: COLORS.accentDark },
  clear: { bg: 'transparent', fg: COLORS.text },
};

export default function IconButton({ name, set, onPress, tone = 'light', color, size = 40, iconSize = 20, accessibilityLabel, disabled, style, testID }) {
  const t = TONES[tone] || TONES.light;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, backgroundColor: t.bg },
        pressed ? { opacity: 0.7 } : null,
        disabled ? { opacity: 0.4 } : null,
        style,
      ]}
    >
      <Icon name={name} set={set} size={iconSize} color={color || t.fg} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
});
