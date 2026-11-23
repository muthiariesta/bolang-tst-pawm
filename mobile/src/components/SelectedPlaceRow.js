import { View, StyleSheet } from 'react-native';
import AppText from './AppText';
import IconButton from './IconButton';
import PlaceImage from './PlaceImage';
import CategoryBadge from './CategoryBadge';
import { COLORS } from '../theme/colors';
import { RADIUS } from '../theme/spacing';

// Baris tempat terpilih di layar Buat Itinerary, dengan tombol hapus.
export default function SelectedPlaceRow({ place, index, onRemove }) {
  return (
    <View style={styles.row}>
      <PlaceImage place={place} style={styles.thumb} radius={10} />
      <View style={styles.body}>
        <AppText variant="title" numberOfLines={1}>
          {place.name || place.id}
        </AppText>
        {place.category ? <CategoryBadge category={place.category} /> : null}
      </View>
      <IconButton name="close" tone="soft" size={34} iconSize={16} onPress={onRemove} accessibilityLabel={`Hapus ${place.name || place.id}`} testID={`remove-${index}`} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 14, backgroundColor: COLORS.card },
  thumb: { width: 40, height: 40, borderRadius: RADIUS.sm },
  body: { flex: 1, gap: 4 },
});
