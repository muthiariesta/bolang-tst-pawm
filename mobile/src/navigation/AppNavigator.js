import { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as SplashScreen from 'expo-splash-screen';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../context/PlanContext';
import { COLORS } from '../theme/colors';
import { FONTS } from '../theme/typography';
import { SHADOW } from '../theme/spacing';
import { ROUTES } from './routes';

import OnboardingScreen from '../screens/OnboardingScreen';
import AuthScreen from '../screens/AuthScreen';
import JelajahiScreen from '../screens/JelajahiScreen';
import RencanaSayaScreen from '../screens/RencanaSayaScreen';
import TemplateScreen from '../screens/TemplateScreen';
import ProfilScreen from '../screens/ProfilScreen';
import DetailTempatScreen from '../screens/DetailTempatScreen';
import BuatItineraryScreen from '../screens/BuatItineraryScreen';
import MenyusunScreen from '../screens/MenyusunScreen';
import DetailItineraryScreen from '../screens/DetailItineraryScreen';
import UsulanPenggantiScreen from '../screens/UsulanPenggantiScreen';
import KonteksHariScreen from '../screens/KonteksHariScreen';
import RencanaAjaibScreen from '../screens/RencanaAjaibScreen';
import AdminTambahTempatScreen from '../screens/AdminTambahTempatScreen';
import TentangScreen from '../screens/TentangScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Komponen Figma "Nav/BottomBar": Jelajahi | Rencana | Template | Profil
const TAB_ICONS = {
  [ROUTES.JELAJAHI]: ['compass', 'compass-outline'],
  [ROUTES.RENCANA]: ['calendar', 'calendar-outline'],
  [ROUTES.TEMPLATE]: ['reader', 'reader-outline'],
  [ROUTES.PROFIL]: ['person', 'person-outline'],
};

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: COLORS.primary, background: COLORS.background, card: COLORS.card, text: COLORS.text, border: COLORS.border },
};

function MainTabs() {
  const { count } = usePlan();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primaryDark,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarLabelStyle: { fontFamily: FONTS.medium, fontSize: 11 },
        tabBarStyle: { backgroundColor: COLORS.card, borderTopWidth: 0, ...SHADOW.nav },
        tabBarItemStyle: { paddingTop: 4 },
        tabBarIcon: ({ focused, color, size }) => (
          <Icon name={TAB_ICONS[route.name][focused ? 0 : 1]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name={ROUTES.JELAJAHI} component={JelajahiScreen} />
      <Tab.Screen
        name={ROUTES.RENCANA}
        component={RencanaSayaScreen}
        options={{ tabBarBadge: count || undefined, tabBarBadgeStyle: { backgroundColor: COLORS.accent, fontFamily: FONTS.semibold, fontSize: 10 } }}
      />
      <Tab.Screen name={ROUTES.TEMPLATE} component={TemplateScreen} />
      <Tab.Screen name={ROUTES.PROFIL} component={ProfilScreen} />
    </Tab.Navigator>
  );
}

// Stack utama: Tab (Main) → layar detail menutupi tab bar.
export default function AppNavigator({ fontsLoaded }) {
  const { ready, token } = useAuth();
  const appReady = ready && fontsLoaded;

  useEffect(() => {
    if (appReady) SplashScreen.hideAsync().catch(() => {});
  }, [appReady]);

  if (!appReady) return null; // splash screen masih tampil

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        // Sudah login → langsung ke tab. Belum login (baru pasang / habis keluar) → Onboarding.
        initialRouteName={token ? ROUTES.MAIN : ROUTES.ONBOARDING}
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background }, animation: 'slide_from_right' }}
      >
        <Stack.Screen name={ROUTES.ONBOARDING} component={OnboardingScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name={ROUTES.MAIN} component={MainTabs} options={{ animation: 'fade' }} />
        <Stack.Screen name={ROUTES.AUTH} component={AuthScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name={ROUTES.DETAIL_TEMPAT} component={DetailTempatScreen} />
        <Stack.Screen name={ROUTES.BUAT_ITINERARY} component={BuatItineraryScreen} />
        <Stack.Screen name={ROUTES.MENYUSUN} component={MenyusunScreen} options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name={ROUTES.DETAIL_ITINERARY} component={DetailItineraryScreen} />
        <Stack.Screen
          name={ROUTES.USULAN_PENGGANTI}
          component={UsulanPenggantiScreen}
          options={{ presentation: 'transparentModal', animation: 'slide_from_bottom', contentStyle: { backgroundColor: 'transparent' } }}
        />
        <Stack.Screen name={ROUTES.KONTEKS_HARI} component={KonteksHariScreen} />
        <Stack.Screen name={ROUTES.RENCANA_AJAIB} component={RencanaAjaibScreen} />
        <Stack.Screen name={ROUTES.ADMIN_TAMBAH_TEMPAT} component={AdminTambahTempatScreen} />
        <Stack.Screen name={ROUTES.TENTANG} component={TentangScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}