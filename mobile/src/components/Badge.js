import { View, StyleSheet } from 'react-native';
import AppText from './AppText';
import Icon from './Icon';
import { getTone } from '../theme/colors';
import { RADIUS } from '../theme/spacing';

// Komponen Figma "Badge/*": label kecil berbentuk pil.
// tone: green | purple | blue | amber | red | neutral
//   <Badge label="Curug" tone="blue" />   <Badge label="Mitra · Iklan" tone="amber" />
export default function Badge({ label, tone = 'green', icon, style }) {
  const t = getTone(tone);
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }, style]}>
      {icon ? <Icon name={icon} size={12} color={t.fg} /> : null}
      <AppText variant="caption" color={t.fg} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
});
