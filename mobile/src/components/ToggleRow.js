import { View, Switch, StyleSheet } from 'react-native';
import AppText from './AppText';
import Card from './Card';
import { COLORS } from '../theme/colors';

// Baris dengan sakelar (mis. "Ruang terbuka" di form admin).
export default function ToggleRow({ title, subtitle, value, onValueChange, testID }) {
  return (
    <Card padding={14}>
      <View style={styles.row}>
        <View style={styles.body}>
          <AppText variant="title">{title}</AppText>
          {subtitle ? (
            <AppText variant="caption" color="textSecondary">
              {subtitle}
            </AppText>
          ) : null}
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          testID={testID}
          trackColor={{ false: COLORS.border, true: COLORS.primary }}
          thumbColor={COLORS.white}
          ios_backgroundColor={COLORS.border}
          accessibilityLabel={title}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  body: { flex: 1, gap: 2 },
});
