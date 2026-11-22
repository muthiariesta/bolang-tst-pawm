import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import AppText from './AppText';
import Card from './Card';
import Icon from './Icon';
import IconButton from './IconButton';
import PlaceImage from './PlaceImage';
import CategoryBadge from './CategoryBadge';
import { summarizeHours } from '../utils/openingHours';
import { RADIUS } from '../theme/spacing';

// Komponen Figma "Card/Place" (US-01): foto, kategori, nama, jam buka, lokasi.
// Tombol + / ✓ di kanan menambah tempat ke rencana (US-02).
function PlaceCard({ place, onPress, selected = false, onToggleSelect, subtitle }) {
  return (
    <Card elevated padding={10} radius={20} onPress={onPress} accessibilityLabel={`Buka ${place.name}`} style={styles.card}>
      <View style={styles.row}>
        <PlaceImage place={place} style={styles.image} />
        <View style={styles.body}>
          <CategoryBadge category={place.category} />
          <AppText variant="title" numberOfLines={1}>
            {place.name}
          </AppText>
          <View style={styles.meta}>
            <Icon name="time-outline" size={14} color="muted" />
            <AppText variant="bodySm" color="textSecondary" numberOfLines={1} style={styles.flex}>
              {summarizeHours(place.opening_hours)}
            </AppText>
          </View>
          <View style={styles.meta}>
            <Icon name={place.outdoor ? 'sunny-outline' : 'home-outline'} size={14} color="muted" />
            <AppText variant="bodySm" color="textSecondary" numberOfLines={1} style={styles.flex}>
              {subtitle || place.region_name || place.region_code}
              {` · ${place.outdoor ? 'Ruang terbuka' : 'Ruang tertutup'}`}
            </AppText>
          </View>
        </View>
        {onToggleSelect ? (
          <IconButton
            name={selected ? 'checkmark' : 'add'}
            tone={selected ? 'primary' : 'soft'}
            size={36}
            iconSize={20}
            onPress={() => onToggleSelect(place)}
            accessibilityLabel={selected ? `Hapus ${place.name} dari rencana` : `Tambah ${place.name} ke rencana`}
            testID={`toggle-${place.id}`}
          />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  image: { width: 92, height: 92, borderRadius: RADIUS.md },
  body: { flex: 1, gap: 5 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flex: { flex: 1 },
});

// memo: kartu hanya dirender ulang bila props berubah (Modul 8, performa FlatList)
export default memo(PlaceCard);
