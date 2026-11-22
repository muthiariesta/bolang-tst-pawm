import { useMemo, useState } from 'react';
import { View, FlatList, Alert, StyleSheet } from 'react-native';
import AppText from '../components/AppText';
import CategoryChips from '../components/CategoryChips';
import HeaderBar from '../components/HeaderBar';
import ListRowCard from '../components/ListRowCard';
import Screen from '../components/Screen';
import SectionHeader from '../components/SectionHeader';
import StateView from '../components/StateView';
import TemplateCard from '../components/TemplateCard';
import useApi from '../hooks/useApi';
import useResponsive from '../hooks/useResponsive';
import { getPlaces, getTemplates } from '../services/ApiService';
import { ROUTES } from '../navigation/routes';
import { MAX_WIDTH } from '../theme/layout';

const DAY_FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: '1', label: '1 hari' },
  { key: '2', label: '2 hari' },
  { key: '3', label: '3+ hari' },
];

// Figma 07 · Template — US-06
export default function TemplateScreen({ navigation }) {
  const { gutter, columns } = useResponsive();
  const numColumns = columns(1, 2, 3);
  const [days, setDays] = useState('all');

  const { data, loading, error, refreshing, refetch, reload } = useApi(() => getTemplates(), []);
  const { data: catalog } = useApi(() => getPlaces(), []);
  const byId = useMemo(() => Object.fromEntries((catalog?.items || []).map((p) => [p.id, p])), [catalog]);

  const all = data || [];
  const partners = all.filter((t) => t.featured || t.partner_label);
  const publicList = useMemo(
    () =>
      all
        .filter((t) => !(t.featured || t.partner_label))
        .filter((t) => days === 'all' || (days === '3' ? t.days >= 3 : t.days === Number(days))),
    [all, days],
  );

  const applyTemplate = (t) => {
    const names = (t.place_ids || []).map((id) => byId[id]?.name || id);
    Alert.alert(t.title || 'Template', `${t.days} hari · ${names.length} tempat\n\n${names.join(' • ')}`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Pakai template', onPress: () => navigation.navigate(ROUTES.BUAT_ITINERARY, { prefill: { place_ids: t.place_ids, days: t.days, title: t.title } }) },
    ]);
  };

  if (loading && !data) {
    return (
      <View style={styles.root}>
        <HeaderBar large title="Template" subtitle="Rencana selesai yang bisa dipakai ulang" />
        <StateView loading />
      </View>
    );
  }

  return (
    <Screen
      header={<HeaderBar large title="Template" subtitle="Rencana selesai yang bisa dipakai ulang" />}
      maxWidth={MAX_WIDTH.list}
      refreshing={refreshing}
      onRefresh={refetch}
    >
      {error && !data ? <StateView error={error} onRetry={reload} /> : null}

      {partners.length ? (
        <>
          <SectionHeader title="Rute unggulan mitra" />
          <FlatList
            horizontal
            data={partners}
            keyExtractor={(t) => t.id}
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -gutter }}
            contentContainerStyle={[styles.hList, { paddingHorizontal: gutter }]}
            renderItem={({ item }) => <TemplateCard template={item} coverPlace={byId[item.place_ids?.[0]]} onPress={() => applyTemplate(item)} />}
          />
          <AppText variant="caption" color="muted">
            Rute unggulan mitra selalu berlabel dan tidak otomatis berada di urutan teratas hasil pencarian.
          </AppText>
        </>
      ) : null}

      <SectionHeader title="Template publik" count={publicList.length} />
      <CategoryChips items={DAY_FILTERS} selected={days} onSelect={setDays} style={{ marginHorizontal: -gutter }} />
      {publicList.length ? (
        <View style={styles.grid}>
          {publicList.map((t) => (
            <View key={t.id} style={{ width: `${100 / numColumns}%`, padding: numColumns > 1 ? 6 : 0, paddingVertical: 6 }}>
              <ListRowCard place={byId[t.place_ids?.[0]]} title={t.title || 'Template perjalanan'} meta={`${t.days} hari · ${t.place_ids?.length || 0} tempat`} onPress={() => applyTemplate(t)} />
            </View>
          ))}
        </View>
      ) : (
        <StateView compact empty emptyIcon="reader-outline" emptyTitle="Belum ada template" emptyText="Tandai itinerary selesai lalu bagikan agar tampil di sini." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hList: { gap: 12, paddingVertical: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
});
