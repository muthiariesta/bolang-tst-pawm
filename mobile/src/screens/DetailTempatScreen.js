import { View, ScrollView, Share, Linking, FlatList, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../components/AppText';
import Badge from '../components/Badge';
import BottomBar from '../components/BottomBar';
import Button from '../components/Button';
import Card from '../components/Card';
import CategoryBadge from '../components/CategoryBadge';
import HeaderBar from '../components/HeaderBar';
import Icon from '../components/Icon';
import IconButton from '../components/IconButton';
import PlaceImage from '../components/PlaceImage';
import StatTile from '../components/StatTile';
import StateView from '../components/StateView';
import TemplateCard from '../components/TemplateCard';
import useApi from '../hooks/useApi';
import useResponsive from '../hooks/useResponsive';
import { usePlan } from '../context/PlanContext';
import { getPlace, getTemplates } from '../services/ApiService';
import { getCategory } from '../data/categories';
import { DAY_KEYS, DAY_LABELS } from '../data/constants';
import { formatHours, getHoursForDate, normalizeOpeningHours, dayKeyOf } from '../utils/openingHours';
import { toISODate } from '../utils/format';
import { ROUTES } from '../navigation/routes';
import { COLORS } from '../theme/colors';
import { RADIUS } from '../theme/spacing';
import { MAX_WIDTH } from '../theme/layout';

// Figma 03 · Detail Tempat
export default function DetailTempatScreen({ navigation, route }) {
  const { placeId, place: initial } = route.params;
  const insets = useSafeAreaInsets();
  const { width, gutter, isWide } = useResponsive();
  const plan = usePlan();

  const { data: place, loading, error, reload } = useApi(() => getPlace(placeId), [placeId], { initialData: initial || null });
  const { data: templates } = useApi(() => getTemplates({ place_id: placeId }), [placeId]);

  if (!place) {
    return (
      <View style={styles.root}>
        <HeaderBar title="Detail Tempat" onBack={() => navigation.goBack()} />
        <StateView loading={loading} error={error} onRetry={reload} />
      </View>
    );
  }

  const today = toISODate();
  const week = normalizeOpeningHours(place.opening_hours);
  const todayKey = dayKeyOf(today);
  const cat = getCategory(place.category);
  const selected = plan.isSelected(place.id);
  const heroHeight = Math.min(Math.max(width * (isWide ? 0.5 : 0.85), 260), 420);

  const share = () =>
    Share.share({ message: `${place.name} (${cat.label}) · ${place.region_name || place.region_code}\nJam buka hari ini: ${formatHours(getHoursForDate(place.opening_hours, today))}\nhttps://maps.google.com/?q=${place.lat},${place.lon}` });
  const openMaps = () => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <PlaceImage place={place} radius={0} style={{ width: '100%', height: heroHeight }} />
        <View style={[styles.sheet, { paddingHorizontal: gutter }]}>
          <View style={styles.inner}>
            <View style={styles.badges}>
              <CategoryBadge category={place.category} />
              <Badge label={place.outdoor ? 'Ruang terbuka' : 'Ruang tertutup'} tone={place.outdoor ? 'green' : 'neutral'} icon={place.outdoor ? 'sunny-outline' : 'home-outline'} />
            </View>
            <AppText variant="h1">{place.name}</AppText>
            <View style={styles.loc}>
              <Icon name="location-outline" size={16} color="muted" />
              <AppText variant="bodySm" color="textSecondary" style={styles.flex}>
                {place.region_name ? `${place.region_name} · kode ${place.region_code}` : `Kode wilayah ${place.region_code}`}
              </AppText>
            </View>

            <View style={styles.stats}>
              <StatTile icon="time-outline" tone="green" value={formatHours(week[todayKey])} label="Jam buka hari ini" />
              <StatTile icon="hourglass-outline" tone="purple" value={`${place.default_visit_min} mnt`} label="Lama bawaan" />
              <StatTile icon="pricetag-outline" tone={cat.tone} value={cat.label} label="Kategori" />
            </View>

            <AppText variant="h3">Tentang tempat</AppText>
            <AppText variant="body" color="textSecondary">
              {place.description || 'Belum ada deskripsi untuk tempat ini.'}
            </AppText>

            <AppText variant="h3">Jam buka minggu ini</AppText>
            <Card padding={14}>
              {DAY_KEYS.map((k) => (
                <View key={k} style={[styles.dayRow, k === todayKey ? styles.today : null]}>
                  <AppText variant={k === todayKey ? 'title' : 'body'} color={k === todayKey ? 'primaryDark' : 'textSecondary'}>
                    {DAY_LABELS[k]}
                  </AppText>
                  <AppText variant={k === todayKey ? 'title' : 'body'} color={week[k] ? (k === todayKey ? 'primaryDark' : 'text') : 'danger'}>
                    {formatHours(week[k])}
                  </AppText>
                </View>
              ))}
            </Card>

            <AppText variant="h3">Lokasi</AppText>
            <Card padding={0} style={styles.mapCard}>
              <View style={styles.map}>
                <Icon name="location" size={34} color="primary" />
              </View>
              <View style={styles.mapFooter}>
                <AppText variant="bodySm" color="textSecondary" style={styles.flex}>
                  {`${Number(place.lat).toFixed(4)}, ${Number(place.lon).toFixed(4)}`}
                </AppText>
                <Button title="Buka di Maps" size="sm" variant="outline" icon="map-outline" onPress={openMaps} />
              </View>
            </Card>

            {templates?.length ? (
              <>
                <AppText variant="h3">Template yang melewati tempat ini</AppText>
                <FlatList
                  horizontal
                  data={templates}
                  keyExtractor={(t) => t.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tplList}
                  style={{ marginHorizontal: -gutter }}
                  renderItem={({ item }) => (
                    <TemplateCard
                      template={item}
                      coverPlace={place}
                      width={210}
                      onPress={() => navigation.navigate(ROUTES.BUAT_ITINERARY, { prefill: { place_ids: item.place_ids, days: item.days, title: item.title } })}
                    />
                  )}
                  ListHeaderComponent={<View style={{ width: gutter - 12 }} />}
                  ListFooterComponent={<View style={{ width: gutter - 12 }} />}
                />
              </>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.topBar, { top: insets.top + 8, paddingHorizontal: 16 }]} pointerEvents="box-none">
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} accessibilityLabel="Kembali" />
        <IconButton name="share-outline" onPress={share} color={COLORS.primaryDark} accessibilityLabel="Bagikan tempat" />
      </View>

      <BottomBar>
        {selected
          ? [
              <Button key="rm" title="Hapus dari rencana" variant="secondary" onPress={() => plan.remove(place.id)} />,
              <Button key="go" title={`Lihat rencana (${plan.count})`} onPress={() => navigation.navigate(ROUTES.BUAT_ITINERARY)} />,
            ]
          : <Button title="Tambah ke rencana" icon="add" onPress={() => plan.add(place)} testID="btn-add" />}
      </BottomBar>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: 24 },
  sheet: {
    marginTop: -28,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    backgroundColor: COLORS.background,
    paddingTop: 22,
    alignItems: 'center',
  },
  inner: { width: '100%', maxWidth: MAX_WIDTH.form, gap: 14 },
  badges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  loc: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flex: { flex: 1 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8 },
  today: { backgroundColor: COLORS.primarySoft },
  mapCard: { overflow: 'hidden' },
  map: { height: 120, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' },
  mapFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  tplList: { gap: 12, paddingVertical: 4 },
  topBar: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between' },
});
