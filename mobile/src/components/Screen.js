import { View, ScrollView, KeyboardAvoidingView, Platform, RefreshControl, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { MAX_WIDTH } from '../theme/layout';
import useResponsive from '../hooks/useResponsive';
import BottomBar from './BottomBar';

// Kerangka layar: header (lebar penuh) + konten (dibatasi maxWidth & dipusatkan) + footer tetap.
//   <Screen header={<HeaderBar .../>} footer={<Button .../>}> ...isi... </Screen>
// scroll={false} untuk layar yang memakai FlatList sendiri.
export default function Screen({
  header,
  footer,
  children,
  scroll = true,
  keyboard = false,
  maxWidth = MAX_WIDTH.form,
  gap = 16,
  padded = true,
  refreshing,
  onRefresh,
  backgroundColor = COLORS.background,
  contentStyle,
}) {
  const { gutter } = useResponsive();
  const inner = [styles.inner, { maxWidth, gap, paddingHorizontal: padded ? gutter : 0 }, contentStyle];

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} /> : undefined}
    >
      <View style={inner}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.center]}>
      <View style={[inner, styles.flex, styles.fullWidth]}>{children}</View>
    </View>
  );

  const content = (
    <View style={[styles.flex, { backgroundColor }]}>
      {header}
      {body}
      {footer ? <BottomBar maxWidth={maxWidth}>{footer}</BottomBar> : null}
    </View>
  );

  if (!keyboard) return content;
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {content}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center' },
  fullWidth: { width: '100%' },
  scrollContent: { alignItems: 'center', paddingTop: 4, paddingBottom: 28 },
  inner: { width: '100%' },
});
