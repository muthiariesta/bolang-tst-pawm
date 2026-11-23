import { memo } from 'react';
import { Pressable, View, ActivityIndicator, StyleSheet } from 'react-native';
import AppText from './AppText';
import Icon from './Icon';
import { COLORS } from '../theme/colors';
import { RADIUS, SHADOW } from '../theme/spacing';
import { MIN_TOUCH } from '../theme/layout';

// Komponen Figma "Button/*": Primary (hijau), Secondary (ungu lembut), Ghost (teks).
// Variant tambahan: outline, accent (ungu penuh, untuk fitur AI), danger.
const VARIANTS = {
  primary: { bg: COLORS.primary, fg: COLORS.white, border: null, shadow: true },
  secondary: { bg: COLORS.accentSoft, fg: COLORS.accentDark, border: COLORS.accentTint },
  accent: { bg: COLORS.accent, fg: COLORS.white, border: null },
  outline: { bg: 'transparent', fg: COLORS.primaryDark, border: COLORS.primary },
  ghost: { bg: 'transparent', fg: COLORS.primaryDark, border: null },
  danger: { bg: COLORS.dangerSoft, fg: COLORS.danger, border: null },
};

function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconSet,
  iconRight,
  loading = false,
  disabled = false,
  style,
  testID,
  accessibilityLabel,
}) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        { backgroundColor: v.bg },
        v.border ? { borderWidth: 1.5, borderColor: v.border } : null,
        v.shadow && !inactive ? SHADOW.button : null,
        pressed && !inactive ? styles.pressed : null,
        inactive ? styles.dim : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} testID="button-loading" />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} set={iconSet} size={18} color={v.fg} /> : null}
          <AppText variant="button" color={v.fg} numberOfLines={1}>
            {title}
          </AppText>
          {iconRight ? <Icon name={iconRight} size={18} color={v.fg} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  md: { paddingVertical: 15, paddingHorizontal: 24 },
  sm: { paddingVertical: 9, paddingHorizontal: 16, minHeight: 38 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  dim: { opacity: 0.5 },
});

export default memo(Button);
