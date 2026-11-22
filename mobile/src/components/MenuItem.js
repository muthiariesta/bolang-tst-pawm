import { View, StyleSheet } from 'react-native';
import AppText from './AppText';
import Card from './Card';
import Icon from './Icon';
import IconBox from './IconBox';
import { COLORS } from '../theme/colors';

// Baris menu dengan kotak ikon berwarna (Profil, usulan pengganti).
// `selected` memberi garis tepi hijau (pilihan tunggal).
export default function MenuItem({ icon, tone = 'green', title, subtitle, onPress, selected = false, right, testID }) {
  return (
    <Card onPress={onPress} padding={12} testID={testID} style={selected ? styles.selected : null} accessibilityLabel={title}>
      <View style={styles.row}>
        <IconBox name={icon} tone={tone} size={40} iconSize={20} />
        <View style={styles.body}>
          <AppText variant="title" numberOfLines={1}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" color="muted" numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {right !== undefined ? right : selected ? <Icon name="checkmark-circle" size={22} color="primary" /> : <Icon name="chevron-forward" size={18} color="muted" />}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  body: { flex: 1, gap: 2 },
  selected: { borderColor: COLORS.primary, borderWidth: 1.5 },
});
