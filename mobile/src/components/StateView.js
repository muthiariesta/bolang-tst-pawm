import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AppText from './AppText';
import Button from './Button';
import IconBox from './IconBox';
import { COLORS } from '../theme/colors';

// Tiga kondisi yang wajib ditangani (Modul 7): loading, error, kosong.
//   <StateView loading={loading && !data} error={error} onRetry={refetch} empty={!items.length} emptyTitle="..." />
// Jika tidak ada kondisi khusus, children yang ditampilkan.
export default function StateView({
  loading,
  error,
  onRetry,
  empty,
  emptyIcon = 'search-outline',
  emptyTitle = 'Belum ada data',
  emptyText,
  emptyAction,
  children,
  compact = false,
}) {
  if (loading) {
    return (
      <View style={[styles.center, compact ? styles.compact : null]} testID="state-loading">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={[styles.center, compact ? styles.compact : null]} testID="state-error">
        <IconBox name="cloud-offline-outline" tone="red" size={56} iconSize={28} radius={18} />
        <AppText variant="h3" align="center">
          Gagal memuat
        </AppText>
        <AppText variant="bodySm" color="textSecondary" align="center" style={styles.text}>
          {error.message || String(error)}
        </AppText>
        {onRetry ? <Button title="Coba lagi" variant="outline" size="sm" icon="refresh" onPress={onRetry} /> : null}
      </View>
    );
  }
  if (empty) {
    return (
      <View style={[styles.center, compact ? styles.compact : null]} testID="state-empty">
        <IconBox name={emptyIcon} tone="green" size={56} iconSize={28} radius={18} />
        <AppText variant="h3" align="center">
          {emptyTitle}
        </AppText>
        {emptyText ? (
          <AppText variant="bodySm" color="textSecondary" align="center" style={styles.text}>
            {emptyText}
          </AppText>
        ) : null}
        {emptyAction || null}
      </View>
    );
  }
  return children || null;
}

const styles = StyleSheet.create({
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 48, paddingHorizontal: 24 },
  compact: { paddingVertical: 24, flexGrow: 0 },
  text: { maxWidth: 320 },
});
