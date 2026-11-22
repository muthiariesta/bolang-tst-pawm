import { View, StyleSheet } from 'react-native';
import AppText from './AppText';
import Card from './Card';
import Icon from './Icon';
import IconBox from './IconBox';
import { CONTEXT_TONE } from '../theme/colors';

// Komponen Figma "Card/Context" (US-05). kind: 'kisah' | 'acara' | 'kuliner' | 'konteks'
// Warna mengikuti variabel context/*: kisah ungu, acara amber, kuliner hijau.
const ICONS = { kisah: 'book-outline', acara: 'ticket-outline', kuliner: 'restaurant-outline', konteks: 'albums-outline' };

export default function ContextCard({ kind = 'kisah', title, source, onPress, right }) {
  const tone = CONTEXT_TONE[kind] || 'purple';
  return (
    <Card onPress={onPress} padding={12} accessibilityLabel={`${title}. ${source || ''}`}>
      <View style={styles.row}>
        <IconBox name={ICONS[kind] || ICONS.konteks} tone={tone} />
        <View style={styles.body}>
          <AppText variant="title" numberOfLines={2}>
            {title}
          </AppText>
          {source ? (
            <AppText variant="bodySm" color="muted" numberOfLines={1}>
              {source}
            </AppText>
          ) : null}
        </View>
        {right || (onPress ? <Icon name="chevron-forward" size={18} color="muted" /> : null)}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  body: { flex: 1, gap: 2 },
});
