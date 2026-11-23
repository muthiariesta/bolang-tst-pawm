import { View, StyleSheet } from 'react-native';
import AppText from './AppText';
import Icon from './Icon';
import { COLORS, getTone } from '../theme/colors';
import { RADIUS } from '../theme/spacing';

// Ubin statistik kecil (Detail Tempat: jam buka, lama bawaan, kategori).
export default function StatTile({ icon, tone = 'green', value, label }) {
  const t = getTone(tone);
  return (
    <View style={styles.tile} accessibilityLabel={`${label}: ${value}`}>
      <Icon name={icon} size={20} color={t.fg} />
      <AppText variant="title" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        {value}
      </AppText>
      <AppText variant="caption" color="muted" numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, gap: 6, padding: 12, borderRadius: RADIUS.md, backgroundColor: COLORS.card, minWidth: 96 },
});
