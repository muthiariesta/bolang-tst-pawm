import { View, Pressable, StyleSheet } from 'react-native';
import AppText from './AppText';
import Icon from './Icon';

// Komponen Figma "SectionHeader": judul seksi + aksi "Lihat semua" (opsional).
export default function SectionHeader({ title, count, actionLabel, onAction, style }) {
  return (
    <View style={[styles.row, style]}>
      <AppText variant="h3" style={styles.flex} numberOfLines={1}>
        {title}
        {count != null ? <AppText variant="h3" color="muted">{`  ${count}`}</AppText> : null}
      </AppText>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={8} style={styles.action} accessibilityRole="button">
          <AppText variant="label" color="primaryDark">
            {actionLabel}
          </AppText>
          <Icon name="chevron-forward" size={16} color="primaryDark" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  flex: { flex: 1 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
