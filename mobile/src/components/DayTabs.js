import { ScrollView, StyleSheet } from 'react-native';
import Chip from './Chip';

// Komponen Figma "Tab/Day-Active" & "Tab/Day-Default".
//   <DayTabs count={2} selected={0} onSelect={setDay} />
export default function DayTabs({ count, selected, onSelect }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.row}>
      {Array.from({ length: count }, (_, i) => (
        <Chip key={i} label={`Hari ${i + 1}`} selected={selected === i} onPress={() => onSelect(i)} testID={`day-${i}`} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: { gap: 8 },
});
