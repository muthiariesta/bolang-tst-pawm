import { Image, StyleSheet } from 'react-native';
import { getPlaceImage } from '../data/placeImages';
import { COLORS } from '../theme/colors';

// Foto tempat (lokal per kategori, atau image_url dari API). Ukuran wajib dari style.
export default function PlaceImage({ place, style, radius = 16 }) {
  return (
    <Image
      source={getPlaceImage(place)}
      style={[styles.img, { borderRadius: radius }, style]}
      resizeMode="cover"
      accessibilityIgnoresInvertColors
      accessible
      accessibilityLabel={place?.name ? `Foto ${place.name}` : 'Foto tempat'}
    />
  );
}

const styles = StyleSheet.create({
  img: { backgroundColor: COLORS.primaryTint },
});
