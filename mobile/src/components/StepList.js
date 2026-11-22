import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AppText from './AppText';
import Card from './Card';
import Icon from './Icon';
import { COLORS } from '../theme/colors';

// Daftar langkah dengan status (Figma layar 14 "Menyusun itinerary").
// steps: [{ label, status: 'done' | 'active' | 'todo' }]
export default function StepList({ steps }) {
  return (
    <Card padding={16} radius={20}>
      <View style={styles.list}>
        {steps.map((s) => (
          <View key={s.label} style={styles.row} accessibilityLabel={`${s.label}, ${s.status === 'done' ? 'selesai' : s.status === 'active' ? 'sedang berjalan' : 'menunggu'}`}>
            {s.status === 'done' ? (
              <Icon name="checkmark-circle" size={24} color="primary" />
            ) : s.status === 'active' ? (
              <View style={styles.dot}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : (
              <View style={[styles.dot, styles.todo]} />
            )}
            <AppText variant="body" color={s.status === 'todo' ? 'muted' : 'text'} style={styles.flex}>
              {s.label}
            </AppText>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  todo: { borderWidth: 1.5, borderColor: COLORS.border },
  flex: { flex: 1 },
});
