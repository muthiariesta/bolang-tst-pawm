import { View, StyleSheet } from 'react-native';
import AppText from './AppText';
import Icon from './Icon';
import { getTone } from '../theme/colors';
import { RULES } from '../data/constants';
import { formatTemp, weatherIcon } from '../utils/format';

// Komponen Figma "Weather/Chip": suhu maksimum + peluang hujan per hari (data Open-Meteo dari backend).
export default function WeatherChip({ weather }) {
  if (!weather || weather.precipitation_probability == null) {
    const t = getTone('neutral');
    return (
      <View style={[styles.chip, { backgroundColor: t.bg }]}>
        <Icon name="cloud-offline-outline" size={16} color={t.fg} />
        <AppText variant="label" color={t.fg}>
          Cuaca belum tersedia
        </AppText>
      </View>
    );
  }
  const prob = weather.precipitation_probability;
  const t = getTone(prob >= RULES.rainThreshold ? 'blue' : prob >= 40 ? 'blue' : 'green');
  return (
    <View style={[styles.chip, { backgroundColor: t.bg }]} accessibilityLabel={`Suhu ${Math.round(weather.temp_max)} derajat, peluang hujan ${prob} persen`}>
      <Icon name={weatherIcon(prob)} size={16} color={t.fg} />
      <AppText variant="label" color={t.fg}>
        {`${formatTemp(weather.temp_max)}  ·  hujan ${prob}%`}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
});
