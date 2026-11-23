import { useState } from 'react';
import { View, Alert, Share, StyleSheet } from 'react-native';
import AppText from '../components/AppText';
import Button from '../components/Button';
import Card from '../components/Card';
import ContextCard from '../components/ContextCard';
import DayTabs from '../components/DayTabs';
import HeaderBar from '../components/HeaderBar';
import Icon from '../components/Icon';
import IconButton from '../components/IconButton';
import InfoNote from '../components/InfoNote';
import RainAlert from '../components/RainAlert';
import RouteMap from '../components/RouteMap';
import Screen from '../components/Screen';
import StateView from '../components/StateView';
import StopItem from '../components/StopItem';
import WeatherChip from '../components/WeatherChip';
import Badge from '../components/Badge';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { getItinerary, updateItinerary, shareItinerary } from '../services/ApiService';
import { formatDateLong, formatDateShort } from '../utils/format';
import {
  buildReorderPayload,
  itineraryTitle,
  legAfterStop,
  moveItem,
  rainWarning,
  reasonLabel,
  statusOf,
  STATUS_LABELS,
  stopName,
  stopPlaceId,
} from '../utils/itinerary';
import { STATUS_TONE } from '../theme/colors';
import { MAX_WIDTH } from '../theme/layout';
import { ROUTES } from '../navigation/routes';

// Figma 05 & 12 · Detail Itinerary per Hari — US-03 (rute & cuaca), US-04 (ubah urutan & kunci), US-06 (bagikan)
export default function DetailItineraryScreen({ navigation, route }) {
  const { id, itinerary: initial } = route.params;
  const { withAuth } = useAuth();
  const { data: it, setData, loading, error, refreshing, refetch, reload } = useApi(() => withAuth(getItinerary, id), [id], { initialData: initial || null });

  const [day, setDay] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null); // salinan stop per hari saat mode ubah urutan
  const [busy, setBusy] = useState(null); // 'save' | 'finish' | 'share' | 'refresh'

  if (!it) {
    return (
      <View style={styles.root}>
        <HeaderBar title="Itinerary" onBack={() => navigation.goBack()} />
        <StateView loading={loading} error={error} onRetry={reload} />
      </View>
    );
  }

  const dayPlans = it.day_plans || [];
  const dayIndex = Math.min(day, Math.max(dayPlans.length - 1, 0));
  const dayPlan = dayPlans[dayIndex] || { stops: [], legs: [], warnings: [] };
  const stops = editing ? draft[dayIndex] : dayPlan.stops || [];
  const warning = rainWarning(dayPlan);
  const status = statusOf(it);
  const title = itineraryTitle(it);

  // ---- aksi ---------------------------------------------------------------
  const run = async (key, fn, successMsg) => {
    setBusy(key);
    try {
      const result = await fn();
      if (successMsg) Alert.alert('Berhasil', successMsg);
      return result;
    } catch (e) {
      Alert.alert('Gagal', e.message);
      return null;
    } finally {
      setBusy(null);
    }
  };

  const startEdit = () => {
    setDraft(dayPlans.map((d) => (d.stops || []).map((s) => ({ ...s }))));
    setEditing(true);
  };

  const move = (index, dir) => setDraft((prev) => prev.map((list, di) => (di === dayIndex ? moveItem(list, index, index + dir) : list)));
  const toggleLock = (index) =>
    setDraft((prev) => prev.map((list, di) => (di === dayIndex ? list.map((s, si) => (si === index ? { ...s, locked: !s.locked } : s)) : list)));

  const saveOrder = async () => {
    const updated = await run('save', () => withAuth(updateItinerary, id, buildReorderPayload(draft)));
    if (updated) {
      setData(updated);
      setEditing(false);
    }
  };

  const markDone = () =>
    Alert.alert('Tandai selesai?', 'Itinerary berstatus selesai bisa dibagikan sebagai template.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Tandai selesai',
        onPress: async () => {
          const updated = await run('finish', () => withAuth(updateItinerary, id, { status: 'selesai' }));
          if (updated) setData(updated);
        },
      },
    ]);

  const shareAsTemplate = async () => {
    const tpl = await run('share', () => withAuth(shareItinerary, id));
    if (tpl) {
      Alert.alert('Dibagikan', 'Itinerary kini tampil di tab Template tanpa data pribadimu.', [
        { text: 'OK' },
        { text: 'Lihat Template', onPress: () => navigation.navigate(ROUTES.MAIN, { screen: ROUTES.TEMPLATE }) },
      ]);
    }
  };

  // needs_refresh: hitung ulang dengan urutan yang sama
  const refreshData = async () => {
    const updated = await run('refresh', () => withAuth(updateItinerary, id, buildReorderPayload(dayPlans.map((d) => d.stops || []))));
    if (updated) setData(updated);
  };

  const shareText = () => {
    const lines = [`${title} · ${it.days} hari`];
    dayPlans.forEach((d, i) => {
      lines.push(`\nHari ${i + 1} (${formatDateLong(d.date)})`);
      (d.stops || []).forEach((s, si) => lines.push(`${si + 1}. ${s.start_time || s.arrival_time} ${stopName(s)}`));
    });
    Share.share({ message: lines.join('\n') });
  };

  const openContext = () => {
    const regionCodes = [...new Set((dayPlan.stops || []).map((s) => String(s.place_snapshot?.region_code || '').slice(0, 5)).filter(Boolean))];
    const first = dayPlan.stops?.[0]?.place_snapshot;
    navigation.navigate(ROUTES.KONTEKS_HARI, {
      dayIndex,
      date: dayPlan.date,
      regionCodes,
      center: first ? { lat: first.lat, lon: first.lon } : null,
    });
  };

  // ---- tampilan ---------------------------------------------------------------
  const footer = editing
    ? [
        <Button key="cancel" title="Batal" variant="ghost" onPress={() => setEditing(false)} />,
        <Button key="save" title="Simpan urutan" onPress={saveOrder} loading={busy === 'save'} />,
      ]
    : it.status === 'selesai'
      ? [
          <Button key="edit" title="Ubah urutan" variant="secondary" onPress={startEdit} />,
          <Button key="share" title="Bagikan template" icon="share-social-outline" onPress={shareAsTemplate} loading={busy === 'share'} />,
        ]
      : [
          <Button key="edit" title="Ubah urutan" variant="secondary" onPress={startEdit} />,
          <Button key="done" title="Tandai selesai" onPress={markDone} loading={busy === 'finish'} />,
        ];

  return (
    <Screen
      maxWidth={MAX_WIDTH.content}
      refreshing={refreshing}
      onRefresh={editing ? undefined : refetch}
      header={
        <HeaderBar
          title={title}
          subtitle={`Itinerary ${it.days} hari · mulai ${formatDateShort(it.start_date)}`}
          onBack={() => navigation.goBack()}
          right={<IconButton name="share-outline" onPress={shareText} color="primaryDark" accessibilityLabel="Bagikan ringkasan" />}
        />
      }
      footer={footer}
      gap={14}
    >
      <View style={styles.rowBetween}>
        <DayTabs count={dayPlans.length} selected={dayIndex} onSelect={(i) => setDay(i)} />
        <Badge label={STATUS_LABELS[status]} tone={STATUS_TONE[status]} />
      </View>

      {it.needs_refresh ? (
        <InfoNote tone="amber" icon="refresh-circle-outline" action={<Button title="Segarkan jadwal" size="sm" variant="outline" onPress={refreshData} loading={busy === 'refresh'} />}>
          Data tempat di Katalog Tempat berubah sejak itinerary dibuat. Itinerary tetap bisa dipakai, tetapi sebaiknya disegarkan.
        </InfoNote>
      ) : null}

      <View style={styles.rowBetween}>
        <AppText variant="title" style={styles.flex}>
          {formatDateLong(dayPlan.date)}
        </AppText>
        <WeatherChip weather={dayPlan.weather} />
      </View>

      <RouteMap stops={stops} />

      {warning ? (
        <RainAlert
          probability={dayPlan.weather?.precipitation_probability ?? 70}
          alternativesCount={warning.alternatives?.length || 0}
          onPress={() => navigation.navigate(ROUTES.USULAN_PENGGANTI, { itinerary: it, warning })}
        />
      ) : dayPlan.weather ? (
        <InfoNote tone="purple">Cuaca mendukung. Tidak ada peringatan hujan untuk hari ini.</InfoNote>
      ) : null}

      {editing ? (
        <InfoNote tone="purple" icon="swap-vertical-outline">
          Ubah urutan dengan tombol panah. Stop yang dikunci tidak dipindahkan saat jadwal dihitung ulang.
        </InfoNote>
      ) : null}

      {stops.length ? (
        <View style={styles.stops}>
          {stops.map((s, i) => (
            <StopItem
              key={stopPlaceId(s)}
              stop={s}
              index={i}
              leg={editing ? null : legAfterStop(dayPlan, i)}
              isLast={i === stops.length - 1}
              editing={editing}
              canMoveUp={i > 0}
              canMoveDown={i < stops.length - 1}
              onMoveUp={() => move(i, -1)}
              onMoveDown={() => move(i, 1)}
              onToggleLock={() => toggleLock(i)}
              onPress={() => navigation.navigate(ROUTES.DETAIL_TEMPAT, { placeId: stopPlaceId(s) })}
            />
          ))}
        </View>
      ) : (
        <InfoNote tone="neutral">Belum ada stop di hari ini.</InfoNote>
      )}

      {it.unscheduled?.length ? (
        <View style={styles.section}>
          <AppText variant="h3">{`Tidak terjadwal (${it.unscheduled.length})`}</AppText>
          {it.unscheduled.map((u) => (
            <Card key={u.place_id || u.name} padding={12}>
              <View style={styles.unsched}>
                <Icon name="alert-circle-outline" size={20} color="warning" />
                <View style={styles.flex}>
                  <AppText variant="title">{u.name || u.place_snapshot?.name || u.place_id}</AppText>
                  <AppText variant="bodySm" color="textSecondary">
                    {reasonLabel(u.reason)}
                  </AppText>
                </View>
              </View>
            </Card>
          ))}
        </View>
      ) : null}

      {!editing ? (
        <ContextCard kind="konteks" title={`Konteks Hari ${dayIndex + 1}`} source="Kisah, acara, dan kuliner" onPress={openContext} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  flex: { flex: 1 },
  stops: { gap: 12 },
  section: { gap: 10 },
  unsched: { flexDirection: 'row', gap: 10 },
});
