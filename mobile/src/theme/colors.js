// Satu sumber warna untuk seluruh aplikasi.
// Nilai disalin dari Variables Figma (koleksi "Bolang Tokens"). Nama di komentar = nama variabel.

export const PALETTE = {
  green50: '#ECF6F0', // color/green/50
  green100: '#CFE9DC', // color/green/100
  green200: '#A7D8C1', // color/green/200
  green300: '#6FBF9A', // color/green/300
  green500: '#1F8A63', // color/green/500  (primary)
  green600: '#176B4D', // color/green/600
  green700: '#0F4F39', // color/green/700
  purple50: '#F3F0FC', // color/purple/50
  purple100: '#E4DCF9', // color/purple/100
  purple300: '#B7A7EF', // color/purple/300
  purple500: '#6D5AD6', // color/purple/500 (aksen)
  purple600: '#574AB0', // color/purple/600
  ink: '#15201B', // color/neutral/ink
  slate: '#52615A', // color/neutral/slate
  muted: '#8A978F', // color/neutral/muted
  line: '#E4EAE6', // color/neutral/line
  bg: '#F4F8F6', // color/neutral/bg
  white: '#FFFFFF', // color/neutral/white
  rain: '#3C7DD9', // color/semantic/rain
  rainBg: '#EAF2FC', // color/semantic/rainBg
  warn: '#E39A2B', // color/semantic/warn
  warnBg: '#FCF2E1', // color/semantic/warnBg
  danger: '#E2563F', // color/semantic/danger
  sun: '#F2B33D', // color/semantic/sun
};

// Nama peran yang dipakai di kode. Hijau = warna utama (role/action-primary),
// ungu = fitur AI & penanda kunci (role/action-ai), biru = cuaca, amber = peringatan.
export const COLORS = {
  primary: PALETTE.green500,
  primaryDark: PALETTE.green600,
  primaryDeep: PALETTE.green700,
  primarySoft: PALETTE.green50,
  primaryTint: PALETTE.green100,
  primaryLight: PALETTE.green300,

  accent: PALETTE.purple500,
  accentDark: PALETTE.purple600,
  accentSoft: PALETTE.purple50,
  accentTint: PALETTE.purple100,
  accentLight: PALETTE.purple300,

  background: PALETTE.bg,
  card: PALETTE.white,
  text: PALETTE.ink,
  textSecondary: PALETTE.slate,
  muted: PALETTE.muted,
  border: PALETTE.line,

  info: PALETTE.rain,
  infoSoft: PALETTE.rainBg,
  warning: PALETTE.warn,
  warningSoft: PALETTE.warnBg,
  danger: PALETTE.danger,
  dangerSoft: '#FCEBE7', // turunan danger untuk latar ringan
  sun: PALETTE.sun,

  white: '#FFFFFF',
  overlay: 'rgba(21, 32, 27, 0.45)',
};

// Tone = pasangan latar + teks. Sama dengan variabel alias di Figma:
// category/*, context/*, status/* (masing-masing punya /bg dan /fg).
export const TONES = {
  green: { bg: COLORS.primarySoft, fg: COLORS.primaryDark },
  purple: { bg: COLORS.accentSoft, fg: COLORS.accentDark },
  blue: { bg: COLORS.infoSoft, fg: COLORS.info },
  amber: { bg: COLORS.warningSoft, fg: COLORS.warning },
  red: { bg: COLORS.dangerSoft, fg: COLORS.danger },
  neutral: { bg: COLORS.background, fg: COLORS.textSecondary },
};

// context/kisah, context/acara, context/kuliner
export const CONTEXT_TONE = { kisah: 'purple', acara: 'amber', kuliner: 'green' };

// status/draft, status/selesai, status/perlu-disegarkan
export const STATUS_TONE = { draft: 'purple', selesai: 'green', refresh: 'amber' };

export function getTone(name) {
  return TONES[name] || TONES.neutral;
}
