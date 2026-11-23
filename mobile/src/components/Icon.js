import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

// Satu pintu untuk ikon. Default Ionicons (icons.expo.fyi); set="mci" untuk MaterialCommunityIcons
// (mis. ikon "motorbike" yang tidak ada di Ionicons).
export default function Icon({ name, size = 20, color = 'text', set = 'ion', style }) {
  const resolved = COLORS[color] || color;
  const Lib = set === 'mci' ? MaterialCommunityIcons : Ionicons;
  return <Lib name={name} size={size} color={resolved} style={style} />;
}
