import { useState } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../components/AppText';
import Button from '../components/Button';
import CustomInput from '../components/CustomInput';
import Illustration from '../components/Illustration';
import InfoNote from '../components/InfoNote';
import Screen from '../components/Screen';
import Segmented from '../components/Segmented';
import useForm from '../hooks/useForm';
import { useAuth } from '../context/AuthContext';
import { validateAkun } from '../utils/validators';
import { ROUTES } from '../navigation/routes';

const AWAL = { nama: '', email: '', password: '' };
const MODES = [
  { key: 'login', label: 'Masuk' },
  { key: 'daftar', label: 'Daftar' },
];

// Figma 10 · Masuk / Daftar
export default function AuthScreen({ navigation, route }) {
  const { login, register } = useAuth();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState(route.params?.mode || 'login');
  const [loading, setLoading] = useState(false);
  const { values, errors, handleChange, handleSubmit, setValues, setErrors } = useForm(AWAL, (v) => validateAkun(v, mode));
  const daftar = mode === 'daftar';

  const leave = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.reset({ index: 0, routes: [{ name: ROUTES.MAIN }] });
  };

  const kirim = async ({ nama, email, password }) => {
    setLoading(true);
    try {
      if (daftar) await register(nama, email, password);
      else await login(email, password);
      leave();
    } catch (e) {
      Alert.alert(daftar ? 'Gagal mendaftar' : 'Gagal masuk', e.message);
    } finally {
      setLoading(false);
    }
  };

  const changeMode = (m) => {
    setMode(m);
    setErrors({});
  };

  return (
    <Screen
      keyboard
      header={
      <View style={{ paddingTop: insets.top + 100 }} />
    }
    >
      <View style={styles.hero}>
        <Illustration maxWidth={180} widthRatio={0.46} />
        <AppText variant="h1" color="green200" align="center">
          {daftar ? 'Mulai Sekarang!' : 'Selamat Datang Kembali!'}
        </AppText>
        <AppText variant="bodySm" color="muted" align="center">
          Masuk untuk melanjutkan petualanganmu
        </AppText>
        <Segmented options={MODES} value={mode} onChange={changeMode} pill />
      </View>
      <CustomInput
        label="Email"
        value={values.email}
        onChangeText={handleChange('email')}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        testID="input-email"
      />
      <CustomInput
        label="Kata sandi"
        value={values.password}
        onChangeText={handleChange('password')}
        error={errors.password}
        secureTextEntry
        textContentType={daftar ? 'newPassword' : 'password'}
        testID="input-password"
      />
      <Button title={daftar ? 'Daftar' : 'Masuk'} onPress={handleSubmit(kirim)} loading={loading} testID="btn-submit" />
      <Button title="Lanjut sebagai tamu" variant="ghost" onPress={leave} />

      {!daftar ? (
        <InfoNote
          tone="green"
          icon="key-outline"
          action={
            <Button
              title="Isi akun demo"
              size="sm"
              variant="outline"
              onPress={() => setValues((v) => ({ ...v, email: 'demo@bolang.id', password: 'bolang2026' }))}
            />
          }
        >
          Akun demo: demo@bolang.id / bolang2026
        </InfoNote>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 20, marginBottom: 4 },
});
