import { Image } from 'react-native';
import { ILLUSTRATION } from '../data/placeImages';
import useResponsive from '../hooks/useResponsive';

// Ilustrasi Bolang (diekspor dari Figma, @1x/@2x/@3x). Lebar mengikuti layar, rasio tetap.
const RATIO = 646 / 692;

export default function Illustration({ maxWidth = 263, widthRatio = 0.68, style }) {
  const { width } = useResponsive();
  const w = Math.min(maxWidth, width * widthRatio);
  return <Image source={ILLUSTRATION} style={[{ width: w, height: w * RATIO }, style]} resizeMode="contain" accessibilityIgnoresInvertColors accessibilityLabel="Ilustrasi pejalan dan balon udara" />;
}
