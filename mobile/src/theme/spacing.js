// Jarak kelipatan 4 (variabel space/* di Figma).
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Variabel radius/* di Figma.
export const RADIUS = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

// Effect styles Elevation/* di Figma.
// Android memakai elevation, iOS memakai shadow*. Keduanya ditulis agar konsisten.
const SHADOW_COLOR = '#17402F';
export const SHADOW = {
  card: {
    shadowColor: SHADOW_COLOR,
    shadowOpacity: 0.1,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  float: {
    shadowColor: SHADOW_COLOR,
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  nav: {
    shadowColor: SHADOW_COLOR,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  button: {
    shadowColor: '#1F8A63',
    shadowOpacity: 0.3,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
};
