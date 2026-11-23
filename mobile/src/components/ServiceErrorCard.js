import { View, StyleSheet } from 'react-native';
import AppText from './AppText';
import Button from './Button';
import Card from './Card';
import IconBox from './IconBox';

// Kartu "layanan mitra tidak tersedia" (Figma layar 15). Hanya bagian ini yang gagal,
// bagian lain di layar tetap bisa dipakai.
export default function ServiceErrorCard({ title, message, onRetry, loading }) {
  return (
    <Card elevated padding={14}>
      <View style={styles.row}>
        <IconBox name="alert-circle-outline" tone="amber" size={40} iconSize={20} />
        <View style={styles.body}>
          <AppText variant="title">{title}</AppText>
          <AppText variant="bodySm" color="textSecondary">
            {message}
          </AppText>
          {onRetry ? (
            <View style={styles.action}>
              <Button title="Muat ulang" variant="outline" size="sm" onPress={onRetry} loading={loading} />
            </View>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  body: { flex: 1, gap: 4 },
  action: { alignSelf: 'flex-start', marginTop: 6 },
});
