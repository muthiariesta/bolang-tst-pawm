import { View, Pressable, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { RADIUS, SHADOW } from '../theme/spacing';

// Permukaan kartu putih. elevated=true memakai Elevation/Card, false memakai garis tepi.
export default function Card({ children, onPress, elevated = false, padding = 14, radius = RADIUS.md, style, testID, accessibilityLabel }) {
  const base = [styles.card, { padding, borderRadius: radius }, elevated ? SHADOW.card : styles.bordered, style];
  if (!onPress) {
    return (
      <View style={base} testID={testID}>
        {children}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [base, pressed ? styles.pressed : null]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.card },
  bordered: { borderWidth: 1, borderColor: COLORS.border },
  pressed: { opacity: 0.88 },
});
