import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import AppText from './AppText';
import Badge from './Badge';
import Card from './Card';
import PlaceImage from './PlaceImage';

// Komponen Figma "Card/Template" (US-06). Rute unggulan mitra selalu berlabel (aturan bisnis 7).
function TemplateCard({ template, coverPlace, onPress, width = 220 }) {
  const isPartner = template.featured || template.partner_label;
  return (
    <Card elevated padding={10} radius={20} onPress={onPress} style={{ width }} accessibilityLabel={`Template ${template.title}`}>
      <PlaceImage place={coverPlace} style={styles.image} radius={14} />
      <View style={styles.body}>
        {isPartner ? <Badge label={template.partner_label || 'Mitra · Iklan'} tone="amber" /> : null}
        <AppText variant="title" numberOfLines={2}>
          {template.title || 'Template perjalanan'}
        </AppText>
        <AppText variant="bodySm" color="textSecondary">
          {`${template.days} hari · ${template.place_ids?.length || 0} tempat`}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', aspectRatio: 16 / 9 },
  body: { gap: 6, paddingHorizontal: 4, paddingTop: 10, paddingBottom: 4 },
});

export default memo(TemplateCard);
