import { DAY_KEYS, DAY_LABELS } from '../data/constants';

// Format jam buka dari API tidak diatur ketat ("jam buka ketujuh hari"), jadi parser ini
// menerima beberapa bentuk yang umum:
//   "06:00-17:00"                                  → sama setiap hari
//   { mon: "06:00-17:00", ..., fri: null }          → per hari (null / "tutup" = libur)
//   { mon: { open: "06:00", close: "17:00" }, ... } → per hari, objek
//   { mon: ["06:00", "17:00"], ... }                → per hari, array
//   [ ...7 item ]                                   → indeks 0 = Senin
// Semua bentuk dinormalkan menjadi { open, close } atau null.

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const CLOSED_WORDS = ['tutup', 'closed', 'libur', '-', ''];

export function isValidTime(value) {
  return TIME_RE.test(String(value || ''));
}

export function toMinutes(time) {
  if (!isValidTime(time)) return null;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function normalizeEntry(entry) {
  if (entry == null) return null;
  if (typeof entry === 'string') {
    const text = entry.trim().toLowerCase();
    if (CLOSED_WORDS.includes(text)) return null;
    const parts = entry.split(/\s*[-–]\s*/);
    if (parts.length === 2 && isValidTime(parts[0]) && isValidTime(parts[1])) {
      return { open: parts[0], close: parts[1] };
    }
    return null;
  }
  if (Array.isArray(entry)) {
    if (entry.length === 2 && isValidTime(entry[0]) && isValidTime(entry[1])) {
      return { open: entry[0], close: entry[1] };
    }
    // bentuk [{open, close}] (beberapa sesi) → ambil sesi pertama & terakhir
    if (entry.length && typeof entry[0] === 'object') {
      const first = normalizeEntry(entry[0]);
      const last = normalizeEntry(entry[entry.length - 1]);
      return first && last ? { open: first.open, close: last.close } : null;
    }
    return null;
  }
  if (typeof entry === 'object') {
    if (entry.closed) return null;
    if (isValidTime(entry.open) && isValidTime(entry.close)) {
      return { open: entry.open, close: entry.close };
    }
  }
  return null;
}

const ID_ALIASES = {
  senin: 'mon',
  selasa: 'tue',
  rabu: 'wed',
  kamis: 'thu',
  jumat: 'fri',
  sabtu: 'sat',
  minggu: 'sun',
  monday: 'mon',
  tuesday: 'tue',
  wednesday: 'wed',
  thursday: 'thu',
  friday: 'fri',
  saturday: 'sat',
  sunday: 'sun',
};

// Mengembalikan { mon: {open, close} | null, ..., sun }
export function normalizeOpeningHours(raw) {
  const result = {};
  if (raw == null) {
    DAY_KEYS.forEach((k) => (result[k] = null));
    return result;
  }
  if (typeof raw === 'string') {
    const same = normalizeEntry(raw);
    DAY_KEYS.forEach((k) => (result[k] = same));
    return result;
  }
  if (Array.isArray(raw)) {
    DAY_KEYS.forEach((k, i) => (result[k] = normalizeEntry(raw[i])));
    return result;
  }
  const lowered = {};
  Object.entries(raw).forEach(([k, v]) => {
    const key = String(k).toLowerCase();
    lowered[ID_ALIASES[key] || key.slice(0, 3)] = v;
  });
  DAY_KEYS.forEach((k) => (result[k] = normalizeEntry(lowered[k])));
  return result;
}

// 'YYYY-MM-DD' → 'mon'..'sun' (tanpa pengaruh zona waktu)
export function dayKeyOf(isoDate) {
  const [y, m, d] = String(isoDate).split('-').map(Number);
  const jsDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Minggu
  return DAY_KEYS[(jsDay + 6) % 7];
}

export function getHoursForDate(raw, isoDate) {
  return normalizeOpeningHours(raw)[dayKeyOf(isoDate)];
}

export function formatHours(hours) {
  return hours ? `${hours.open}–${hours.close}` : 'Tutup';
}

// Ringkasan untuk kartu: "06:00–17:00" atau "06:00–17:00 · tutup Jumat"
export function summarizeHours(raw) {
  const week = normalizeOpeningHours(raw);
  const open = DAY_KEYS.filter((k) => week[k]);
  if (!open.length) return 'Jam buka belum diisi';
  const first = week[open[0]];
  const same = open.every((k) => week[k].open === first.open && week[k].close === first.close);
  const closed = DAY_KEYS.filter((k) => !week[k]).map((k) => DAY_LABELS[k]);
  const base = same ? formatHours(first) : 'Jam berbeda tiap hari';
  return closed.length ? `${base} · tutup ${closed.join(', ')}` : base;
}

// Untuk form admin: jam buka/tutup yang sama setiap hari, kecuali hari libur.
// Bentuk yang dikirim ke POST /places: { mon: { open, close } | null, ... }
export function buildOpeningHours({ open, close, closedDays = [] }) {
  const result = {};
  DAY_KEYS.forEach((k) => {
    result[k] = closedDays.includes(k) ? null : { open, close };
  });
  return result;
}
