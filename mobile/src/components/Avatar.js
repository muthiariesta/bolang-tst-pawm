import { View, Pressable, StyleSheet } from 'react-native';
import AppText from './AppText';
import Icon from './Icon';
import { COLORS } from '../theme/colors';
import { initials } from '../utils/format';

// Avatar inisial (ungu lembut). Tanpa nama → ikon orang (mode tamu).
export default function Avatar({ name, size = 44, onPress }) {
  const content = name ? (
    <AppText variant={size >= 56 ? 'h3' : 'label'} color="accentDark">
      {initials(name)}
    </AppText>
  ) : (
    <Icon name="person-outline" size={size * 0.45} color="accentDark" />
  );
  const style = [styles.circle, { width: size, height: size, borderRadius: size / 2 }];
  if (!onPress) return <View style={style}>{content}</View>;
  return (
    <Pressable onPress={onPress} style={style} accessibilityRole="button" accessibilityLabel="Buka profil">
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: { backgroundColor: COLORS.accentTint, alignItems: 'center', justifyContent: 'center' },
});
