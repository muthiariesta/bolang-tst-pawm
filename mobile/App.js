import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { PlanProvider } from './src/context/PlanContext';

// Tahan splash sampai font & sesi login siap (disembunyikan di AppNavigator).
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  return (
    <SafeAreaProvider>
      {/* AuthProvider di luar: PlanProvider & semua layar bisa membaca sesi login */}
      <AuthProvider>
        <PlanProvider>
          {/* Jika font gagal dimuat, aplikasi tetap jalan dengan font sistem */}
          <AppNavigator fontsLoaded={fontsLoaded || Boolean(fontError)} />
          <StatusBar style="dark" />
        </PlanProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
