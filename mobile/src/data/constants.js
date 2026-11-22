// Titik awal siap pilih (koordinat WGS84). Dipakai di layar Buat Itinerary.
export const START_POINTS = [
  { key: 'alun-alun', label: 'Alun-Alun Bandung', lat: -6.9218, lon: 107.6071 },
  { key: 'stasiun', label: 'Stasiun Bandung', lat: -6.9142, lon: 107.6022 },
  { key: 'gedung-sate', label: 'Gedung Sate', lat: -6.9025, lon: 107.6188 },
  { key: 'dago', label: 'Simpang Dago', lat: -6.8848, lon: 107.6131 },
  { key: 'lembang', label: 'Pasar Lembang', lat: -6.8117, lon: 107.6178 },
];

// Backend mendukung `driving` (OSRM) dan `walking` (estimasi).
// Motor & mobil sama-sama memakai rute berkendara.
export const TRAVEL_MODES = [
  { key: 'motor', label: 'Motor', api: 'driving', icon: 'motorbike', iconSet: 'mci' },
  { key: 'mobil', label: 'Mobil', api: 'driving', icon: 'car-outline', iconSet: 'ion' },
  { key: 'jalan', label: 'Jalan', api: 'walking', icon: 'walk-outline', iconSet: 'ion' },
];

// Aturan bisnis (sama dengan README backend & PRD)
export const RULES = {
  maxDays: 7,
  defaultMaxHours: 10,
  minMaxHours: 6,
  maxMaxHours: 12,
  rainThreshold: 70, // % → RAIN_RISK
  forecastDays: 15, // /weather: hari ini s.d. 15 hari ke depan
  alternativeRadiusKm: 10,
};

export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const DAY_LABELS = {
  mon: 'Senin',
  tue: 'Selasa',
  wed: 'Rabu',
  thu: 'Kamis',
  fri: 'Jumat',
  sat: 'Sabtu',
  sun: 'Minggu',
};

export const APP_INFO = {
  name: 'Bolang',
  service: 'Jelajah Rute',
  version: '1.0.0',
  team: [
    { name: 'Muthia Ariesta Anggraeni', nim: '18224045', role: 'Backend & Bisnis (TST)' },
    { name: 'Benedicta Sherin Chyntia Putri', nim: '18224065', role: 'Mobile Developer (PWAM)' },
  ],
  apiDocs: 'https://bolang.stei.fun/api/docs',
};
