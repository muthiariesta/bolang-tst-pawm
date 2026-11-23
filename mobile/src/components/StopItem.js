import { memo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import AppText from './AppText';
import Icon from './Icon';
import IconButton from './IconButton';
import { COLORS } from '../theme/colors';
import { RADIUS } from '../theme/spacing';
import { formatDistance, formatDuration } from '../utils/format';
import { stopName } from '../utils/itinerary';

// Komponen Figma "Item/Stop" (US-02, US-03, US-04): waktu tiba, nomor urut, nama, lama kunjungan,
// status kunci, dan rute ke stop berikutnya. Mode `editing` menampilkan tombol naik/turun & kunci.
function StopItem({ stop, index, leg, isLast, editing = false, canMoveUp, canMoveDown, onMoveUp, onMoveDown, onToggleLock, onPress }) {
  const locked = Boolean(stop.locked);
  const waitText = stop.wait_min > 0 ? ` · tunggu ${stop.wait_min} mnt sampai buka` : ' · dalam jam buka';
  return (
    <View style={styles.row}>
      <View style={styles.timeline}>
        <AppText variant="caption" color="textSecondary">
          {stop.start_time || stop.arrival_time || '--:--'}
        </AppText>
        <View style={[styles.num, { backgroundColor: locked ? COLORS.accent : COLORS.primary }]}>
          <AppText variant="label" color="white">
            {index + 1}
          </AppText>
        </View>
      </View>
      <Pressable
        onPress={onPress}
        disabled={!onPress || editing}
        style={[styles.card, locked ? styles.cardLocked : null]}
        accessibilityLabel={`Stop ${index + 1}, ${stopName(stop)}${locked ? ', dikunci' : ''}`}
      >
        <View style={styles.top}>
          <AppText variant="title" numberOfLines={1} style={styles.flex}>
            {stopName(stop)}
          </AppText>
          {editing ? null : <Icon name={locked ? 'lock-closed' : 'lock-open-outline'} size={16} color={locked ? 'accentDark' : 'muted'} />}
        </View>
        <View style={styles.meta}>
          <Icon name="time-outline" size={14} color="muted" />
          <AppText variant="bodySm" color="textSecondary" style={styles.flex}>
            {`Kunjungan ${stop.visit_min} menit${waitText}`}
          </AppText>
        </View>
        <View style={styles.divider} />
        <View style={styles.meta}>
          <Icon name={isLast ? 'flag-outline' : 'car-outline'} size={14} color="primaryDark" />
          <AppText variant="caption" color="primaryDark" style={styles.flex}>
            {isLast || !leg
              ? 'Stop terakhir hari ini'
              : `${formatDistance(leg.distance_m)} · ${formatDuration(leg.duration_s)} ke stop berikutnya${leg.source === 'estimate' ? ' (perkiraan)' : ''}`}
          </AppText>
        </View>
        {editing ? (
          <View style={styles.editRow}>
            <IconButton name="arrow-up" tone="soft" size={36} onPress={onMoveUp} disabled={!canMoveUp} accessibilityLabel="Naikkan urutan" />
            <IconButton name="arrow-down" tone="soft" size={36} onPress={onMoveDown} disabled={!canMoveDown} accessibilityLabel="Turunkan urutan" />
            <View style={styles.flex} />
            <Pressable onPress={onToggleLock} style={[styles.lockBtn, locked ? styles.lockOn : null]} accessibilityRole="switch" accessibilityState={{ checked: locked }}>
              <Icon name={locked ? 'lock-closed' : 'lock-open-outline'} size={16} color={locked ? 'white' : 'accentDark'} />
              <AppText variant="label" color={locked ? 'white' : 'accentDark'}>
                {locked ? 'Dikunci' : 'Kunci'}
              </AppText>
            </Pressable>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  timeline: { alignItems: 'center', gap: 6, width: 40 },
  num: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  card: {
    flex: 1,
    gap: 8,
    padding: 14,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardLocked: { backgroundColor: COLORS.accentSoft, borderColor: COLORS.accentTint },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  divider: { height: 1, backgroundColor: COLORS.border },
  flex: { flex: 1 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  lockBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: COLORS.accentSoft, borderWidth: 1, borderColor: COLORS.accentTint },
  lockOn: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
});

export default memo(StopItem);
