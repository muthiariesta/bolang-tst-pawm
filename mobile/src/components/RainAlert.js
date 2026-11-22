import { View, Pressable, StyleSheet } from 'react-native';
import AppText from './AppText';
import Icon from './Icon';
import { COLORS } from '../theme/colors';
import { RADIUS } from '../theme/spacing';

// Komponen Figma "Alert/RainRisk" (US-03): peringatan RAIN_RISK + akses ke usulan pengganti.
export default function RainAlert({ probability, alternativesCount = 0, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`Peringatan hujan ${probability} persen. Lihat usulan pengganti`}
      style={({ pressed }) => [styles.box, pressed ? { opacity: 0.85 } : null]}
    >
      <Icon name="warning-outline" size={22} color="warning" />
      <View style={styles.body}>
        <AppText variant="title">{`RAIN_RISK · Peluang hujan ${probability}%`}</AppText>
        <AppText variant="bodySm" color="textSecondary">
          Hari ini memuat tempat ruang terbuka. Usulan pengganti indoor dalam radius 10 km.
        </AppText>
        {onPress ? (
          <View style={styles.link}>
            <AppText variant="label" color="warning">
              {alternativesCount ? `Lihat ${alternativesCount} usulan pengganti` : 'Lihat usulan pengganti'}
            </AppText>
            <Icon name="chevron-forward" size={14} color="warning" />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.warningSoft,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  body: { flex: 1, gap: 3 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
});
