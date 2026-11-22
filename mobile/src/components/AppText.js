import { Text } from 'react-native';
import { COLORS } from '../theme/colors';
import { TYPE } from '../theme/typography';

// Teks dengan text style dari Figma.
//   <AppText variant="h1">Jelajahi</AppText>
//   <AppText variant="bodySm" color="textSecondary" numberOfLines={2}>...</AppText>
// `color` boleh nama di COLORS atau kode warna langsung.
export default function AppText({ variant = 'body', color = 'text', align, style, children, ...rest }) {
  const resolved = COLORS[color] || color;
  return (
    <Text
      maxFontSizeMultiplier={1.4}
      style={[TYPE[variant] || TYPE.body, { color: resolved }, align ? { textAlign: align } : null, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}
