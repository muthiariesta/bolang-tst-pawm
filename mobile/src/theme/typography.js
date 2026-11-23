// Font Plus Jakarta Sans dimuat di App.js lewat useFonts (@expo-google-fonts/plus-jakarta-sans).
export const FONTS = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
};

// Sama dengan Text styles di Figma (ukuran 1x = dp, tanpa konversi).
// letterSpacing Figma dalam persen → dikali ukuran font.
export const TYPE = {
  display: { fontFamily: FONTS.bold, fontSize: 30, lineHeight: 36, letterSpacing: -0.3 }, // Display/XL
  h1: { fontFamily: FONTS.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.12 }, // Heading/H1
  h2: { fontFamily: FONTS.semibold, fontSize: 20, lineHeight: 26, letterSpacing: -0.06 }, // Heading/H2
  h3: { fontFamily: FONTS.semibold, fontSize: 17, lineHeight: 23 }, // Heading/H3
  title: { fontFamily: FONTS.semibold, fontSize: 15, lineHeight: 20 }, // Title/Medium
  body: { fontFamily: FONTS.regular, fontSize: 14, lineHeight: 21 }, // Body/Regular
  bodySm: { fontFamily: FONTS.regular, fontSize: 13, lineHeight: 19 }, // Body/Small
  label: { fontFamily: FONTS.medium, fontSize: 13, lineHeight: 17 }, // Label/Medium
  caption: { fontFamily: FONTS.medium, fontSize: 11, lineHeight: 14, letterSpacing: 0.2 }, // Caption
  button: { fontFamily: FONTS.semibold, fontSize: 15, lineHeight: 20, letterSpacing: 0.2 }, // Button/Label
};
