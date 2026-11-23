import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import AppText from './AppText';
import Card from './Card';
import Icon from './Icon';
import PlaceImage from './PlaceImage';
import { getTone } from '../theme/colors';

// Baris kartu dengan foto kecil: dipakai untuk "Rencana saya" dan "Template publik".
//   <ListRowCard place={coverPlace} title="..." meta="2 hari · 3 tempat" status={{label:'Draft', tone:'purple'}} />
function ListRowCard({ place, title, meta, status, onPress, testID }) {
  const t = status ? getTone(status.tone) : null;
  return (
    <Card elevated padding={10} radius={18} onPress={onPress} testID={testID} accessibilityLabel={title}>
      <View style={styles.row}>
        <PlaceImage place={place} style={styles.thumb} radius={14} />
        <View style={styles.body}>
          <AppText variant="title" numberOfLines={1}>
            {title}
          </AppText>
          {meta ? (
            <AppText variant="bodySm" color="textSecondary" numberOfLines={1}>
              {meta}
            </AppText>
          ) : null}
          {status ? (
            <AppText variant="caption" color={t.fg}>
              {status.label}
            </AppText>
          ) : null}
        </View>
        {onPress ? <Icon name="chevron-forward" size={18} color="muted" /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 64, height: 64 },
  body: { flex: 1, gap: 3 },
});

export default memo(ListRowCard);
