import { forwardRef, useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import AppText from './AppText';
import Icon from './Icon';
import { COLORS } from '../theme/colors';
import { TYPE } from '../theme/typography';
import { RADIUS } from '../theme/spacing';

// Komponen Figma "Input/Field" & "Input/Search".
//   <CustomInput label="Email" value={...} onChangeText={...} error={errors.email} />
//   <CustomInput icon="search" placeholder="Cari tempat..." rounded />
// Props lain (keyboardType, secureTextEntry, multiline, dll.) diteruskan ke TextInput.
const CustomInput = forwardRef(function CustomInput(
  { label, error, hint, icon, rounded = false, multiline = false, secureTextEntry, onPressRight, rightIcon, style, inputStyle, editable = true, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));
  const borderColor = error ? COLORS.danger : focused ? COLORS.primary : COLORS.border;

  return (
    <View style={[styles.wrapper, style]}>
      {label ? (
        <AppText variant="label" color="textSecondary" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.field,
          rounded ? styles.rounded : null,
          multiline ? styles.multiline : null,
          { borderColor },
          !editable ? styles.readonly : null,
        ]}
      >
        {icon ? <Icon name={icon} size={20} color="muted" /> : null}
        <TextInput
          ref={ref}
          style={[styles.input, multiline ? styles.inputMultiline : null, inputStyle]}
          placeholderTextColor={COLORS.muted}
          selectionColor={COLORS.primary}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          secureTextEntry={hidden}
          editable={editable}
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
        {secureTextEntry ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10} accessibilityLabel={hidden ? 'Tampilkan kata sandi' : 'Sembunyikan kata sandi'}>
            <Icon name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color="muted" />
          </Pressable>
        ) : rightIcon ? (
          <Pressable onPress={onPressRight} hitSlop={10} disabled={!onPressRight}>
            <Icon name={rightIcon} size={20} color="muted" />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" color="danger" style={styles.helper}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color="muted" style={styles.helper}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {},
  field: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.card,
  },
  rounded: { borderRadius: RADIUS.pill, minHeight: 48 },
  multiline: { minHeight: 112, alignItems: 'flex-start', paddingVertical: 12 },
  readonly: { backgroundColor: COLORS.background },
  input: { flex: 1, ...TYPE.body, color: COLORS.text, paddingVertical: 12 },
  inputMultiline: { paddingVertical: 0, minHeight: 86 },
  helper: { marginTop: -2 },
});

export default CustomInput;
