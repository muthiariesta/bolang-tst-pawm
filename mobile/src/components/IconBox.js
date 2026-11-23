import { View, StyleSheet } from 'react-native';
import Icon from './Icon';
import { getTone } from '../theme/colors';

// Kotak ikon berwarna lembut (dipakai di kartu konteks, menu profil, usulan pengganti).
export default function IconBox({ name, set, tone = 'green', size = 44, iconSize = 22, radius = 12 }) {
  const t = getTone(tone);
  return (
    <View style={[styles.box, { width: size, height: size, borderRadius: radius, backgroundColor: t.bg }]}>
      <Icon name={name} set={set} size={iconSize} color={t.fg} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
});
