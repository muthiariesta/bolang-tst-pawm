import { View, StyleSheet } from 'react-native';
import AppText from './AppText';
import Icon from './Icon';
import { getTone } from '../theme/colors';

// Catatan informasi berwarna lembut (info ungu, sukses hijau, peringatan amber).
export default function InfoNote({ children, tone = 'purple', icon = 'information-circle-outline', action, style }) {
  const t = getTone(tone);
  return (
    <View style={[styles.note, { backgroundColor: t.bg }, style]}>
      <Icon name={icon} size={18} color={t.fg} style={styles.icon} />
      <View style={styles.body}>
        <AppText variant="bodySm" color={t.fg}>
          {children}
        </AppText>
        {action || null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  note: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 12 },
  icon: { marginTop: 1 },
  body: { flex: 1, gap: 8 },
});
