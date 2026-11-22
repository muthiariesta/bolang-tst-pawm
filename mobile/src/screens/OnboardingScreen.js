import { useEffect, useRef } from 'react';
import { View, Animated, Easing, AccessibilityInfo, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../components/AppText';
import Button from '../components/Button';
import Illustration from '../components/Illustration';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../navigation/routes';
import { COLORS } from '../theme/colors';
import { MAX_WIDTH } from '../theme/layout';
import useResponsive from '../hooks/useResponsive';

// Figma 01 · Onboarding — versi ringkas: ilustrasi besar, judul, satu ajakan.
// Animasi memakai Animated bawaan React Native (tanpa library tambahan, useNativeDriver).
export default function OnboardingScreen({ navigation }) {
  const { completeOnboarding } = useAuth();
  const insets = useSafeAreaInsets();
  const { gutter, height } = useResponsive();

  // 0 → 1 untuk tiap elemen yang muncul bergantian
  const intro = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  // Gerak naik-turun ilustrasi (seperti balon melayang) dan denyut lingkaran latar
  const float = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loops = [];
    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        intro.forEach((v) => v.setValue(1)); // tampil langsung tanpa gerak
        return;
      }
      Animated.stagger(
        140,
        intro.map((v) =>
          Animated.timing(v, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ),
      ).start();

      const loop = (value, duration) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(value, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(value, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ]),
        );
      loops = [loop(float, 2200), loop(pulse, 3000)];
      loops.forEach((l) => l.start());
    });

    return () => {
      cancelled = true;
      loops.forEach((l) => l.stop());
    };
  }, [intro, float, pulse]);

  // Muncul dari bawah sambil memudar masuk
  const enter = (v, distance = 24) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
  });

  const start = async (toAuth) => {
    await completeOnboarding();
    navigation.reset({
      index: toAuth ? 1 : 0,
      routes: toAuth ? [{ name: ROUTES.MAIN }, { name: ROUTES.AUTH }] : [{ name: ROUTES.MAIN }],
    });
  };

  // Ukuran ikut tinggi layar agar tetap muat saat landscape / HP pendek
  const circle = Math.min(340, height * 0.42);

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.hero}>
        <Animated.View
          style={[
            styles.circle,
            {
              width: circle,
              height: circle,
              borderRadius: circle / 2,
              opacity: intro[0],
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.04] }) }],
            },
          ]}
        />
        <Animated.View style={enter(intro[0], 40)}>
          <Animated.View style={{ transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [6, -10] }) }] }}>
            <Illustration maxWidth={Math.min(300, height * 0.36)} widthRatio={0.78} />
          </Animated.View>
        </Animated.View>
      </View>

      <View style={[styles.content, { paddingHorizontal: gutter }]}>
        <Animated.View style={enter(intro[1])}>
          <AppText variant="display" color="primaryDeep" align="center" style={styles.title}>
            Jelajahi Bandung Bersama Bolang!
          </AppText>
        </Animated.View>
        <Animated.View style={enter(intro[2])}>
          <AppText variant="body" color="textSecondary" align="center" style={styles.text}>
            Temukan tempat seru, susun rute perjalanan, dan nikmati setiap petualangan tanpa ribet
          </AppText>
        </Animated.View>
        <Animated.View style={[styles.actions, enter(intro[3])]}>
          <Button title="Mulai Petualangan" onPress={() => start(false)} testID="btn-start" />
          <Pressable onPress={() => start(true)} style={styles.loginButton}>
          <AppText variant="body" color="primaryDeep">
            Sudah punya akun?{' '}
            <AppText variant="body" color="primaryDeep" style={{ fontWeight: '900' }}>
              Masuk
            </AppText>
          </AppText>
        </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.primaryTint },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  circle: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.55)' },
  content: { alignItems: 'center', gap: 12 },
  title: { maxWidth: 340, lineHeight: 40},
  text: { maxWidth: 320 },
  actions: { width: '100%', maxWidth: MAX_WIDTH.form, gap: 8, marginTop: 16 },
  loginButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10,},
});