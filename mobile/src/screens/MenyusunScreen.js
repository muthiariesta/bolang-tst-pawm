import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../components/AppText';
import Button from '../components/Button';
import Illustration from '../components/Illustration';
import InfoNote from '../components/InfoNote';
import StepList from '../components/StepList';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../context/PlanContext';
import { createItinerary } from '../services/ApiService';
import { ROUTES } from '../navigation/routes';
import { COLORS } from '../theme/colors';
import { MAX_WIDTH } from '../theme/layout';
import useResponsive from '../hooks/useResponsive';

const STEPS = ['Mengurutkan kunjungan', 'Memeriksa jam buka', 'Menghitung jarak dan waktu tempuh', 'Mengecek prakiraan cuaca'];

// Figma 14 · Menyusun itinerary (loading). POST /itineraries dijalankan di sini.
// params: { payload, placeCount, keepSelection?, replacesId? }
export default function MenyusunScreen({ navigation, route }) {
  const { payload, placeCount, keepSelection, replacesId } = route.params;
  const { withAuth } = useAuth();
  const plan = usePlan();
  const insets = useSafeAreaInsets();
  const { gutter } = useResponsive();
  const [active, setActive] = useState(0);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    const timer = setInterval(() => setActive((a) => Math.min(a + 1, STEPS.length - 1)), 800);
    let doneTimer;

    withAuth(createItinerary, payload, { signal: controller.signal })
      .then((itinerary) => {
        clearInterval(timer);
        if (!mounted.current) return;
        setActive(STEPS.length); // semua langkah selesai
        if (!keepSelection) plan.clear();
        doneTimer = setTimeout(() => {
          // Ganti layar ini (dan itinerary lama jika ini hasil "Ganti stop") dengan detail itinerary baru
          navigation.dispatch((state) => {
            const routes = state.routes.filter(
              (r) => r.key !== route.key && !(replacesId && r.name === ROUTES.DETAIL_ITINERARY && r.params?.id === replacesId),
            );
            const next = [...routes, { name: ROUTES.DETAIL_ITINERARY, params: { id: itinerary.id, itinerary } }];
            return CommonActions.reset({ ...state, routes: next, index: next.length - 1 });
          });
        }, 450);
      })
      .catch((e) => {
        clearInterval(timer);
        if (mounted.current && e.code !== 'CANCELLED') setError(e);
      });

    return () => {
      mounted.current = false;
      clearInterval(timer);
      clearTimeout(doneTimer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const steps = STEPS.map((label, i) => ({ label, status: i < active ? 'done' : i === active && !error ? 'active' : 'todo' }));
  const count = placeCount || payload.place_ids.length;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 16, paddingHorizontal: gutter }]}>
      <View style={styles.inner}>
        <Illustration maxWidth={200} widthRatio={0.5} style={styles.center} />
        <AppText variant="h2" align="center">
          {error ? 'Itinerary belum tersusun' : 'Menyusun itinerary Anda'}
        </AppText>
        <AppText variant="body" color="textSecondary" align="center">
          {`Mengurutkan ${count} tempat ke dalam ${payload.days} hari`}
        </AppText>
        <StepList steps={steps} />
        {error ? (
          <>
            <InfoNote tone="red" icon="alert-circle-outline">
              {error.message}
            </InfoNote>
            <Button
              title="Coba lagi"
              icon="refresh"
              onPress={() => {
                setError(null);
                setActive(0);
                setAttempt((a) => a + 1);
              }}
            />
          </>
        ) : null}
      </View>
      <Button title={error ? 'Ubah rencana' : 'Batalkan'} variant="ghost" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'space-between' },
  inner: { width: '100%', maxWidth: MAX_WIDTH.form, alignSelf: 'center', gap: 14, alignItems: 'stretch' },
  center: { alignSelf: 'center' },
});
