import { View, Alert, StyleSheet } from 'react-native';
import AppText from '../components/AppText';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import HeaderBar from '../components/HeaderBar';
import MenuItem from '../components/MenuItem';
import Screen from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../context/PlanContext';
import { USE_DUMMY } from '../services/ApiService';
import { APP_INFO } from '../data/constants';
import { ROUTES } from '../navigation/routes';

// Figma 09 · Profil
export default function ProfilScreen({ navigation }) {
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const plan = usePlan();

  // Setelah keluar, kosongkan pilihan tempat lalu kembali ke Onboarding.
  // reset() dipanggil di stack induk (Profil ada di dalam tab) agar tombol back tidak kembali ke tab.
  const handleLogout = async () => {
    await logout();
    plan.clear();
    const rootNav = navigation.getParent() ?? navigation;
    rootNav.reset({ index: 0, routes: [{ name: ROUTES.ONBOARDING }] });
  };

  const confirmLogout = () =>
    Alert.alert('Keluar dari akun?', 'Itinerary tetap tersimpan di server.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: handleLogout },
    ]);

  const accountInfo = () =>
    Alert.alert('Akun & keamanan', 'Sesi login berlaku 1 jam dan disimpan aman di perangkat (expo-secure-store). Kata sandi disimpan sebagai hash bcrypt di server.');

  return (
    <Screen header={<HeaderBar large title="Profil" />} gap={12}>
      {isLoggedIn ? (
        <Card elevated padding={14} radius={20}>
          <View style={styles.user}>
            <Avatar name={user?.name} size={58} />
            <View style={styles.flex}>
              <AppText variant="h3" numberOfLines={1}>
                {user?.name || 'Pengguna Bolang'}
              </AppText>
              <AppText variant="bodySm" color="muted" numberOfLines={1}>
                {user?.email}
              </AppText>
            </View>
            <Badge label={isAdmin ? 'Admin' : 'Wisatawan'} tone={isAdmin ? 'amber' : 'purple'} />
          </View>
        </Card>
      ) : (
        <Card elevated padding={16} radius={20}>
          <View style={styles.guest}>
            <Avatar size={58} />
            <AppText variant="h3">Kamu belum masuk</AppText>
            <AppText variant="bodySm" color="textSecondary" align="center">
              Masuk untuk menyimpan itinerary dan membagikannya sebagai template.
            </AppText>
            <View style={styles.guestActions}>
              <View style={styles.flex}>
                <Button title="Masuk" size="sm" onPress={() => navigation.navigate(ROUTES.AUTH, { mode: 'login' })} />
              </View>
              <View style={styles.flex}>
                <Button title="Daftar" size="sm" variant="secondary" onPress={() => navigation.navigate(ROUTES.AUTH, { mode: 'daftar' })} />
              </View>
            </View>
          </View>
        </Card>
      )}

      <MenuItem icon="calendar-outline" tone="green" title="Rencana saya" subtitle="Itinerary yang kamu susun" onPress={() => navigation.navigate(ROUTES.RENCANA)} />
      <MenuItem icon="bookmark-outline" tone="purple" title="Template" subtitle="Rute unggulan & template publik" onPress={() => navigation.navigate(ROUTES.TEMPLATE)} />
      {isAdmin ? (
        <MenuItem icon="server-outline" tone="amber" title="Admin Katalog Tempat" subtitle="Tambah tempat ke Katalog Tempat" onPress={() => navigation.navigate(ROUTES.ADMIN_TAMBAH_TEMPAT)} />
      ) : null}
      {isLoggedIn ? <MenuItem icon="shield-checkmark-outline" tone="blue" title="Akun & keamanan" onPress={accountInfo} /> : null}
      <MenuItem icon="help-circle-outline" tone="neutral" title="Bantuan & tentang" onPress={() => navigation.navigate(ROUTES.TENTANG)} />

      {isLoggedIn ? <Button title="Keluar" variant="danger" icon="log-out-outline" onPress={confirmLogout} /> : null}

      <AppText variant="caption" color="muted" align="center">
        {`${APP_INFO.name} v${APP_INFO.version}${USE_DUMMY ? ' · mode dummy' : ''}`}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  user: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  guest: { alignItems: 'center', gap: 8 },
  guestActions: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 6 },
  flex: { flex: 1 },
});