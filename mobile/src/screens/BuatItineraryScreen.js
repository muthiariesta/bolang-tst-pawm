import { useEffect, useMemo } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import AppText from '../components/AppText';
import Button from '../components/Button';
import CategoryChips from '../components/CategoryChips';
import CustomInput from '../components/CustomInput';
import DateStrip from '../components/DateStrip';
import HeaderBar from '../components/HeaderBar';
import IconButton from '../components/IconButton';
import InfoNote from '../components/InfoNote';
import Screen from '../components/Screen';
import SectionHeader from '../components/SectionHeader';
import Segmented from '../components/Segmented';
import SelectedPlaceRow from '../components/SelectedPlaceRow';
import Stepper from '../components/Stepper';
import useApi from '../hooks/useApi';
import useForm from '../hooks/useForm';
import useResponsive from '../hooks/useResponsive';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../context/PlanContext';
import { getPlaces } from '../services/ApiService';
import { RULES, START_POINTS, TRAVEL_MODES } from '../data/constants';
import { addDays, toISODate } from '../utils/format';
import { validateItinerary } from '../utils/validators';
import { ROUTES } from '../navigation/routes';

// Figma 04 · Buat Itinerary — US-02
export default function BuatItineraryScreen({ navigation, route }) {
  const prefill = route.params?.prefill;
  const plan = usePlan();
  const { isLoggedIn } = useAuth();
  const { isWide } = useResponsive();
  const today = toISODate();

  // Dari template / Rencana Ajaib: isi ulang pilihan tempat
  useEffect(() => {
    if (prefill?.place_ids?.length) plan.replace(prefill.place_ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  const { data: catalog } = useApi(() => getPlaces(), []);
  const byId = useMemo(() => Object.fromEntries((catalog?.items || []).map((p) => [p.id, p])), [catalog]);
  const selected = plan.selectedIds.map((id) => byId[id] || plan.placesById[id] || { id, name: id });

  const initialDays = prefill?.days || Math.min(RULES.maxDays, Math.max(1, Math.ceil(plan.selectedIds.length / 4)));
  const { values, errors, handleChange, setValue, handleSubmit, setErrors } = useForm(
    { title: prefill?.title || '', startKey: START_POINTS[0].key, startDate: addDays(today, 1), days: initialDays, mode: 'motor', maxHours: RULES.defaultMaxHours },
    (v) => {
      const sp = START_POINTS.find((s) => s.key === v.startKey);
      return validateItinerary({ placeIds: plan.selectedIds, startPoint: sp, startDate: v.startDate, days: v.days, today });
    },
  );

  const submit = (v) => {
    if (!isLoggedIn) {
      Alert.alert('Masuk dulu', 'Itinerary disimpan di akunmu agar bisa diubah dan dibagikan.', [
        { text: 'Nanti', style: 'cancel' },
        { text: 'Masuk', onPress: () => navigation.navigate(ROUTES.AUTH) },
      ]);
      return;
    }
    const sp = START_POINTS.find((s) => s.key === v.startKey);
    const mode = TRAVEL_MODES.find((m) => m.key === v.mode);
    const payload = {
      ...(v.title.trim() ? { title: v.title.trim() } : {}),
      place_ids: plan.selectedIds,
      start_point: { lat: sp.lat, lon: sp.lon },
      start_date: v.startDate,
      days: v.days,
      travel_mode: mode.api,
      max_hours: v.maxHours,
    };
    navigation.navigate(ROUTES.MENYUSUN, { payload, placeCount: plan.selectedIds.length });
  };

  const goCatalog = () => navigation.navigate(ROUTES.MAIN, { screen: ROUTES.JELAJAHI });

  return (
    <Screen
      keyboard
      header={
        <HeaderBar
          title="Buat Itinerary"
          onBack={() => navigation.goBack()}
          right={<IconButton name="sparkles-outline" tone="accent" onPress={() => navigation.navigate(ROUTES.RENCANA_AJAIB)} accessibilityLabel="Rencana Ajaib" />}
        />
      }
      footer={<Button title="Susun rencana" icon="git-network-outline" onPress={handleSubmit(submit)} testID="btn-susun" />}
    >
      <SectionHeader title="Tempat terpilih" count={selected.length} actionLabel="Tambah" onAction={goCatalog} />
      {selected.length ? (
        <View style={styles.list}>
          {selected.map((p, i) => (
            <SelectedPlaceRow key={p.id} place={p} index={i} onRemove={() => plan.remove(p.id)} />
          ))}
        </View>
      ) : (
        <InfoNote tone="green" icon="add-circle-outline" action={<Button title="Pilih dari Katalog Tempat" size="sm" variant="outline" onPress={goCatalog} />}>
          Belum ada tempat. Pilih tempat dari Katalog Tempat lewat tombol + di setiap kartu.
        </InfoNote>
      )}
      {errors.places ? (
        <AppText variant="caption" color="danger">
          {errors.places}
        </AppText>
      ) : null}

      <CustomInput label="Nama rencana (opsional)" placeholder="mis. Alam & Budaya Lembang" value={values.title} onChangeText={handleChange('title')} maxLength={60} />

      <View style={styles.field}>
        <AppText variant="label" color="textSecondary">
          Titik awal
        </AppText>
        <CategoryChips wrap items={START_POINTS.map((s) => ({ key: s.key, label: s.label, icon: 'navigate-outline' }))} selected={values.startKey} onSelect={(k) => setValue('startKey', k)} />
        {errors.startPoint ? (
          <AppText variant="caption" color="danger">
            {errors.startPoint}
          </AppText>
        ) : null}
      </View>

      <DateStrip label="Tanggal mulai" value={values.startDate} onChange={(d) => setValue('startDate', d)} from={today} days={RULES.forecastDays + 1} error={errors.startDate} />

      <View style={[styles.steppers, isWide ? styles.row : null]}>
        <View style={styles.flex}>
          <Stepper label="Jumlah hari" value={values.days} min={1} max={RULES.maxDays} onChange={(n) => setValue('days', n)} format={(n) => `${n} hari`} error={errors.days} />
        </View>
        <View style={styles.flex}>
          <Stepper label="Batas jam per hari" value={values.maxHours} min={RULES.minMaxHours} max={RULES.maxMaxHours} onChange={(n) => setValue('maxHours', n)} format={(n) => `${n} jam`} />
        </View>
      </View>

      <View style={styles.field}>
        <AppText variant="label" color="textSecondary">
          Mode perjalanan
        </AppText>
        <Segmented options={TRAVEL_MODES} value={values.mode} onChange={(m) => setValue('mode', m)} />
      </View>

      <InfoNote tone="green" icon="information-circle-outline">
        Urutan dimulai dari tempat terdekat dengan titik awal, waktu tiba selalu di dalam jam buka, dan tempat yang tidak muat akan masuk daftar tidak terjadwal beserta alasannya.
      </InfoNote>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  field: { gap: 8 },
  steppers: { gap: 16 },
  row: { flexDirection: 'row' },
  flex: { flex: 1 },
});
