import { ScrollView, View, StyleSheet } from 'react-native';
import Chip from './Chip';
import useResponsive from '../hooks/useResponsive';

// Deretan chip filter yang bisa digeser (Modul 4).
// items: [{ key, label, tone?, icon? }]  · selected: key atau array key (multi)
//   <CategoryChips items={cats} selected={kategori} onSelect={setKategori} />
export default function CategoryChips({ items, selected, onSelect, multi = false, wrap = false, padded = true, style }) {
  const { gutter } = useResponsive();
  const isActive = (key) => (multi ? (selected || []).includes(key) : selected === key);

  const chips = items.map((item) => (
    <Chip
      key={item.key}
      label={item.label}
      icon={item.icon}
      tone={item.tone}
      selected={isActive(item.key)}
      onPress={() => onSelect(item.key)}
      testID={`chip-${item.key}`}
    />
  ));

  if (wrap) return <View style={[styles.wrap, style]}>{chips}</View>;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.scroll, style]}
      contentContainerStyle={[styles.row, padded ? { paddingHorizontal: gutter } : null]}
    >
      {chips}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 }, // jangan ambil sisa tinggi layar
  row: { gap: 8, alignItems: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
