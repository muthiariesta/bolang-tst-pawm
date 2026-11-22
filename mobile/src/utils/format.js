// Format tanggal, jarak, durasi, dan cuaca dalam Bahasa Indonesia.
// Nama hari & bulan ditulis manual agar tidak bergantung pada dukungan Intl di Hermes.

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const HARI_PENDEK = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const BULAN_PENDEK = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function parseISO(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return { y, m, d, day: new Date(Date.UTC(y, m - 1, d)).getUTCDay() };
}

// Date lokal → 'YYYY-MM-DD'
export function toISODate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(iso, n) {
  const { y, m, d } = parseISO(iso);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

export function diffDays(fromIso, toIso) {
  const a = parseISO(fromIso);
  const b = parseISO(toIso);
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000);
}

// 'Sabtu, 29 November'
export function formatDateLong(iso) {
  if (!iso) return '';
  const { m, d, day } = parseISO(iso);
  return `${HARI[day]}, ${d} ${BULAN[m - 1]}`;
}

// '29 Nov'
export function formatDateShort(iso) {
  if (!iso) return '';
  const { m, d } = parseISO(iso);
  return `${d} ${BULAN_PENDEK[m - 1]}`;
}

// 'Sab, 29 Nov 2026'
export function formatDateWithYear(iso) {
  if (!iso) return '';
  const { y, m, d, day } = parseISO(iso);
  return `${HARI_PENDEK[day]}, ${d} ${BULAN_PENDEK[m - 1]} ${y}`;
}

export function dayNameShort(iso) {
  return HARI_PENDEK[parseISO(iso).day];
}

export function dayOfMonth(iso) {
  return parseISO(iso).d;
}

// 6100 → '6.1 km', 850 → '850 m'
export function formatDistance(meters) {
  if (meters == null || Number.isNaN(Number(meters))) return '-';
  const m = Number(meters);
  if (m < 1000) return `${Math.round(m)} m`;
  const km = m / 1000;
  return `${km >= 10 ? Math.round(km) : km.toFixed(1)} km`;
}

export function formatKm(km) {
  if (km == null) return '-';
  return formatDistance(Number(km) * 1000);
}

// 1080 → '18 menit', 3900 → '1 jam 5 menit'
export function formatDuration(seconds) {
  if (seconds == null) return '-';
  const totalMin = Math.max(1, Math.round(Number(seconds) / 60));
  const h = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  if (!h) return `${totalMin} menit`;
  return min ? `${h} jam ${min} menit` : `${h} jam`;
}

export function formatMinutes(minutes) {
  return formatDuration(Number(minutes) * 60);
}

export function formatTemp(value) {
  return value == null ? '-' : `${Math.round(Number(value))}°`;
}

// Ikon Ionicons sesuai peluang hujan
export function weatherIcon(probability) {
  if (probability == null) return 'cloud-outline';
  if (probability >= 70) return 'rainy-outline';
  if (probability >= 40) return 'cloudy-outline';
  if (probability >= 20) return 'partly-sunny-outline';
  return 'sunny-outline';
}

// 'Sari Wulandari' → 'SW'
export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

export function pluralTempat(n) {
  return `${n} tempat`;
}
