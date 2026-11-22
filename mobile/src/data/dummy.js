// Data contoh dengan struktur SAMA seperti respons API Jelajah Rute (lihat README backend).
// Dipakai saat EXPO_PUBLIC_USE_DUMMY=true dan di unit test.
import { buildOpeningHours } from '../utils/openingHours';

const everyday = (open, close) => buildOpeningHours({ open, close });
const closedOn = (open, close, closedDays) => buildOpeningHours({ open, close, closedDays });

export const DUMMY_PLACES = [
  {
    id: 'curug-malela', name: 'Curug Malela', category: 'curug', lat: -7.0219, lon: 107.2075,
    region_code: '32.17.10', region_name: 'Rongga, Kab. Bandung Barat', outdoor: true, default_visit_min: 120,
    opening_hours: everyday('06:00', '17:00'),
    description: "Air terjun bertingkat lima yang dijuluki 'Niagara mini'. Akses menantang dan jauh dari pusat kota, jadi sebaiknya dijadwalkan pagi saat cuaca cerah.",
  },
  {
    id: 'tebing-keraton', name: 'Tebing Keraton', category: 'tebing', lat: -6.8344, lon: 107.6635,
    region_code: '32.04.25', region_name: 'Cimenyan, Kab. Bandung', outdoor: true, default_visit_min: 60,
    opening_hours: everyday('05:30', '18:00'),
    description: 'Tebing di Taman Hutan Raya dengan pemandangan lautan kabut saat matahari terbit.',
  },
  {
    id: 'gua-pawon', name: 'Gua Pawon', category: 'situs_sejarah', lat: -6.8311, lon: 107.4326,
    region_code: '32.17.05', region_name: 'Cipatat, Kab. Bandung Barat', outdoor: true, default_visit_min: 60,
    opening_hours: everyday('08:00', '16:00'),
    description: 'Gua prasejarah tempat ditemukannya kerangka manusia purba Bandung.',
  },
  {
    id: 'kawah-putih', name: 'Kawah Putih', category: 'kawah', lat: -7.1661, lon: 107.4021,
    region_code: '32.04.31', region_name: 'Rancabali, Kab. Bandung', outdoor: true, default_visit_min: 90,
    opening_hours: everyday('07:00', '17:00'),
    description: 'Danau kawah berwarna putih kehijauan di ketinggian 2.400 mdpl.',
  },
  {
    id: 'situ-patenggang', name: 'Situ Patenggang', category: 'danau', lat: -7.1667, lon: 107.3578,
    region_code: '32.04.31', region_name: 'Rancabali, Kab. Bandung', outdoor: true, default_visit_min: 90,
    opening_hours: everyday('07:00', '17:00'),
    description: 'Danau di tengah kebun teh dengan legenda Batu Cinta.',
  },
  {
    id: 'tangkuban-parahu', name: 'Tangkuban Parahu', category: 'kawah', lat: -6.7597, lon: 107.6098,
    region_code: '32.17.11', region_name: 'Lembang, Kab. Bandung Barat', outdoor: true, default_visit_min: 90,
    opening_hours: everyday('07:00', '17:00'),
    description: 'Gunung berapi aktif dengan Kawah Ratu yang bisa dilihat dari tepi.',
  },
  {
    id: 'orchid-forest-cikole', name: 'Orchid Forest Cikole', category: 'kebun', lat: -6.7836, lon: 107.6436,
    region_code: '32.17.11', region_name: 'Lembang, Kab. Bandung Barat', outdoor: true, default_visit_min: 90,
    opening_hours: everyday('08:00', '18:00'),
    description: 'Hutan pinus dengan koleksi anggrek dan jembatan gantung.',
  },
  {
    id: 'curug-dago', name: 'Curug Dago', category: 'curug', lat: -6.8656, lon: 107.6156,
    region_code: '32.73.02', region_name: 'Coblong, Kota Bandung', outdoor: true, default_visit_min: 45,
    opening_hours: everyday('08:00', '17:00'),
    description: 'Curug di dalam kota dengan prasasti Raja Thailand.',
  },
  {
    id: 'museum-geologi', name: 'Museum Geologi', category: 'museum', lat: -6.9006, lon: 107.6215,
    region_code: '32.73.06', region_name: 'Bandung Wetan, Kota Bandung', outdoor: false, default_visit_min: 90,
    opening_hours: closedOn('09:00', '15:30', ['fri']),
    description: 'Koleksi batuan, fosil, dan replika T-Rex. Pilihan ruang tertutup saat hujan.',
  },
  {
    id: 'museum-kaa', name: 'Museum Konferensi Asia Afrika', category: 'museum', lat: -6.9211, lon: 107.6094,
    region_code: '32.73.07', region_name: 'Sumur Bandung, Kota Bandung', outdoor: false, default_visit_min: 60,
    opening_hours: closedOn('09:00', '15:00', ['mon']),
    description: 'Gedung Merdeka, tempat Konferensi Asia Afrika 1955.',
  },
  {
    id: 'gedung-sate', name: 'Gedung Sate', category: 'situs_sejarah', lat: -6.9025, lon: 107.6188,
    region_code: '32.73.06', region_name: 'Bandung Wetan, Kota Bandung', outdoor: false, default_visit_min: 45,
    opening_hours: closedOn('08:00', '16:00', ['sun']),
    description: 'Ikon Bandung bergaya Indo-Eropa dengan museum di lantai dasar.',
  },
  {
    id: 'observatorium-bosscha', name: 'Observatorium Bosscha', category: 'situs_sejarah', lat: -6.8247, lon: 107.6157,
    region_code: '32.17.11', region_name: 'Lembang, Kab. Bandung Barat', outdoor: false, default_visit_min: 90,
    opening_hours: closedOn('09:00', '15:00', ['sun', 'mon']),
    description: 'Observatorium tertua di Indonesia, kunjungan dengan pemandu.',
  },
  {
    id: 'trans-studio-bandung', name: 'Trans Studio Bandung', category: 'rekreasi', lat: -6.9255, lon: 107.6337,
    region_code: '32.73.17', region_name: 'Batununggal, Kota Bandung', outdoor: false, default_visit_min: 180,
    opening_hours: everyday('10:00', '21:00'),
    description: 'Taman hiburan dalam ruangan.',
  },
];

export const DUMMY_TEMPLATES = [
  {
    id: 'tpl-lembang', title: 'Akhir pekan alam Lembang', days: 2, featured: true, partner_label: 'Mitra · Iklan',
    place_ids: ['tangkuban-parahu', 'orchid-forest-cikole', 'tebing-keraton', 'observatorium-bosscha', 'curug-dago', 'museum-geologi'],
  },
  {
    id: 'tpl-curug', title: 'Jelajah curug tersembunyi', days: 1, featured: true, partner_label: 'Mitra · Iklan',
    place_ids: ['curug-malela', 'gua-pawon', 'curug-dago', 'museum-geologi'],
  },
  {
    id: 'tpl-dago', title: 'Santai sehari Dago', days: 1, featured: false, partner_label: null,
    place_ids: ['curug-dago', 'tebing-keraton', 'gedung-sate'],
  },
  {
    id: 'tpl-budaya', title: 'Budaya & sejarah Bandung', days: 2, featured: false, partner_label: null,
    place_ids: ['gedung-sate', 'museum-kaa', 'museum-geologi', 'gua-pawon', 'observatorium-bosscha', 'curug-dago', 'trans-studio-bandung'],
  },
  {
    id: 'tpl-ciwidey', title: 'Kawah & danau Ciwidey', days: 1, featured: false, partner_label: null,
    place_ids: ['kawah-putih', 'situ-patenggang'],
  },
];

// Data pelengkap dari layanan mitra (lewat Orkestrasi Rencana).
export const DUMMY_STORIES = [
  { id: 's1', region_code: '32.17', title: 'Legenda Sangkuriang & Tangkuban Parahu', summary: 'Kisah perahu terbalik yang menjadi gunung di utara Bandung.' },
  { id: 's2', region_code: '32.17', title: 'Legenda Curug Malela', summary: "Asal-usul 'Niagara mini' di Bandung Barat menurut warga Rongga." },
  { id: 's3', region_code: '32.73', title: 'Bandung Lautan Api', summary: 'Peristiwa 1946 ketika warga membakar kota sebelum mundur ke selatan.' },
  { id: 's4', region_code: '32.04', title: 'Batu Cinta Situ Patenggang', summary: 'Kisah Ki Santang dan Dewi Rengganis yang saling mencari.' },
];

export const DUMMY_EVENTS = [
  { id: 'e1', region_code: '32.17', title: 'Festival Seni Lembang', date: '2026-11-29', summary: 'Pertunjukan angklung dan karinding di alun-alun Lembang.' },
  { id: 'e2', region_code: '32.73', title: 'Pasar Seni Braga', date: '2026-11-30', summary: 'Pameran seni rupa jalanan di Jalan Braga.' },
  { id: 'e3', region_code: '32.04', title: 'Ngaruat Situ', date: '2026-12-06', summary: 'Upacara adat syukuran di tepi Situ Patenggang.' },
];

export const DUMMY_FOOD = [
  { id: 'f1', name: 'Sate Kelinci Lembang', cuisine: 'Sate', distance_m: 800, open_now: true, lat: -6.812, lon: 107.618 },
  { id: 'f2', name: 'Kopi Armor Dago', cuisine: 'Kafe', distance_m: 3200, open_now: true, lat: -6.857, lon: 107.632 },
  { id: 'f3', name: 'Batagor Riri', cuisine: 'Jajanan', distance_m: 1500, open_now: false, lat: -6.917, lon: 107.613 },
  { id: 'f4', name: 'Mie Kocok Mang Dadeng', cuisine: 'Mi', distance_m: 2100, open_now: true, lat: -6.910, lon: 107.623 },
];

export const DUMMY_USER = { id: 'u-demo', name: 'Sari Wulandari', email: 'demo@bolang.id', role: 'admin' };
export const DUMMY_PASSWORD = 'bolang2026';
