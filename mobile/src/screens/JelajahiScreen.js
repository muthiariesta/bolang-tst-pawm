import { useCallback, useMemo, useState } from 'react';
import { View, FlatList, RefreshControl, StyleSheet } from 'react-native';
import AppText from '../components/AppText';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import CategoryChips from '../components/CategoryChips';
import CustomInput from '../components/CustomInput';
import HeaderBar from '../components/HeaderBar';
import Icon from '../components/Icon';
import PlaceCard from '../components/PlaceCard';
import SectionHeader from '../components/SectionHeader';
import StateView from '../components/StateView';
import useApi from '../hooks/useApi';
import useResponsive from '../hooks/useResponsive';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../context/PlanContext';
import { getPlaces } from '../services/ApiService';
import { ALL_FILTER, CATEGORIES, OUTDOOR_FILTER, getCategoryLabel } from '../data/categories';
import { ROUTES } from '../navigation/routes';
import { COLORS } from '../theme/colors';
import { SHADOW, RADIUS } from '../theme/spacing';
import { MAX_WIDTH } from '../theme/layout';

// Figma 02 · Jelajahi (Katalog Tempat) — US-01
export default function JelajahiScreen({ navigation }) {
  const { user } = useAuth();
  const plan = usePlan();
  const { gutter, columns } = useResponsive();
  const numColumns = columns(1, 2, 3); // HP 1 kolom, layar lebar 2, tablet 3
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(ALL_FILTER.key);

  const { data, loading, error, refreshing, refetch, reload } = useApi(() => getPlaces(), []);
  const places = useMemo(() => data?.items || [], [data]);

  // Chip kategori dibentuk dari data (urutan mengikuti daftar kategori aplikasi)
  const chips = useMemo(() => {
    const present = [...new Set(places.map((p) => p.category))];
    const known = CATEGORIES.filter((c) => present.includes(c.key)).map((c) => ({ key: c.key, label: c.label }));
    const unknown = present.filter((k) => !CATEGORIES.some((c) => c.key === k)).map((k) => ({ key: k, label: getCategoryLabel(k) }));
    return [ALL_FILTER, ...known, ...unknown, OUTDOOR_FILTER];
  }, [places]);

  // useMemo: filter dihitung ulang hanya saat data, kategori, atau kata kunci berubah
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return places.filter((p) => {
      const byFilter = filter === ALL_FILTER.key || (filter === OUTDOOR_FILTER.key ? p.outdoor : p.category === filter);
      const byQuery = !q || p.name.toLowerCase().includes(q) || String(p.region_name || '').toLowerCase().includes(q);
      return byFilter && byQuery;
    });
  }, [places, filter, query]);

  const openPlace = useCallback((place) => navigation.navigate(ROUTES.DETAIL_TEMPAT, { placeId: place.id, place }), [navigation]);
  const toggle = useCallback((place) => plan.toggle(place), [plan]);
  const cellPad = numColumns > 1 ? 6 : 0;

  const header = (
    <View style={styles.listHeader}>
      <CustomInput icon="search" rounded placeholder="Cari tempat di Bandung Raya" value={query} onChangeText={setQuery} returnKeyType="search" clearButtonMode="while-editing" testID="search" />
      <CategoryChips items={chips} selected={filter} onSelect={setFilter} style={{ marginHorizontal: -gutter }} />
      <SectionHeader title="Katalog Tempat" count={filtered.length} />
    </View>
  );

  return (
    <View style={styles.root}>
      <HeaderBar
        large
        title="Jelajahi"
        subtitle={
          <View style={styles.loc}>
            <Icon name="location-outline" size={14} color="primaryDark" />
            <AppText variant="bodySm" color="textSecondary">{`Bandung Raya · ${data?.total ?? places.length} tempat`}</AppText>
          </View>
        }
        right={<Avatar name={user?.name} onPress={() => navigation.navigate(ROUTES.PROFIL)} />}
      />
      {loading && !data ? (
        <StateView loading />
      ) : error && !data ? (
        <StateView error={error} onRetry={reload} />
      ) : (
        <FlatList
          key={numColumns} // wajib: paksa render ulang saat jumlah kolom berubah
          style={styles.list}
          data={filtered}
          numColumns={numColumns}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={header}
          contentContainerStyle={{ paddingHorizontal: gutter - cellPad, paddingBottom: plan.count ? 110 : 24 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
          initialNumToRender={8}
          windowSize={7}
          ListEmptyComponent={<StateView compact empty emptyTitle="Tempat tidak ditemukan" emptyText="Coba kata kunci lain atau pilih kategori Semua." />}
          renderItem={({ item }) => (
            <View style={{ width: `${100 / numColumns}%`, paddingHorizontal: cellPad, paddingVertical: 6 }}>
              <PlaceCard place={item} onPress={() => openPlace(item)} selected={plan.isSelected(item.id)} onToggleSelect={toggle} />
            </View>
          )}
        />
      )}

      {plan.count ? (
        <View style={[styles.floatWrap, { paddingHorizontal: gutter }]} pointerEvents="box-none">
          <View style={styles.float}>
            <View style={styles.floatText}>
              <AppText variant="title" color="white">{`${plan.count} tempat dipilih`}</AppText>
              <AppText variant="caption" color="white" style={styles.floatSub}>
                Siap disusun jadi itinerary
              </AppText>
            </View>
            <Button title="Susun" size="sm" variant="secondary" iconRight="arrow-forward" onPress={() => navigation.navigate(ROUTES.BUAT_ITINERARY)} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  list: { width: '100%', maxWidth: MAX_WIDTH.list, alignSelf: 'center' },
  listHeader: { gap: 14, paddingBottom: 4, paddingTop: 4, paddingHorizontal: 0 },
  loc: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  floatWrap: { position: 'absolute', left: 0, right: 0, bottom: 12, alignItems: 'center' },
  float: {
    width: '100%',
    maxWidth: MAX_WIDTH.form,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingLeft: 18,
    paddingRight: 12,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryDeep,
    ...SHADOW.float,
  },
  floatText: { flex: 1 },
  floatSub: { opacity: 0.85 },
});
