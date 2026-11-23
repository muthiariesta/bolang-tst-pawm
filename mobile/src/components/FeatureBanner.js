import { View, Pressable, StyleSheet } from 'react-native';
import AppText from './AppText';
import Icon from './Icon';
import { COLORS } from '../theme/colors';
import { RADIUS } from '../theme/spacing';

// Banner fitur berwarna penuh. tone 'accent' (ungu, fitur AI) atau 'primary' (hijau).
export default function FeatureBanner({ title, text, icon = 'sparkles-outline', onPress, tone = 'accent', style }) {
  const bg = tone === 'primary' ? COLORS.primary : COLORS.accent;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${text || ''}`}
      style={({ pressed }) => [styles.banner, { backgroundColor: bg }, pressed ? { opacity: 0.9 } : null, style]}
    >
      <View style={styles.iconWrap}>
        <Icon name={icon} size={22} color="white" />
      </View>
      <View style={styles.body}>
        <AppText variant="title" color="white">
          {title}
        </AppText>
        {text ? (
          <AppText variant="bodySm" color="white" style={styles.text}>
            {text}
          </AppText>
        ) : null}
      </View>
      {onPress ? <Icon name="chevron-forward" size={18} color="white" /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: RADIUS.lg },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)' },
  body: { flex: 1, gap: 2 },
  text: { opacity: 0.92 },
});
