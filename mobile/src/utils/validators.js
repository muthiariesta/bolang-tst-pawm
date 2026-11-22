// Fungsi validasi murni (pure function): input → objek error. Objek kosong {} = valid.
import { RULES } from '../data/constants';
import { diffDays } from './format';
import { isValidTime, toMinutes } from './openingHours';
import { isInBandungRaya } from './geo';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

// Form Masuk / Daftar (mode: 'login' | 'daftar')
export function validateAkun(values, mode = 'login') {
  const errors = {};
  if (mode === 'daftar' && !String(values.nama || '').trim()) {
    errors.nama = 'Nama wajib diisi';
  }
  if (!EMAIL_RE.test(String(values.email || '').trim())) {
    errors.email = 'Format email tidak valid';
  }
  if (String(values.password || '').length < 8) {
    errors.password = 'Kata sandi minimal 8 karakter';
  }
  return errors;
}

// Form Buat Itinerary (US-02)
export function validateItinerary({ placeIds = [], startPoint, startDate, days, today }) {
  const errors = {};
  if (!placeIds.length) errors.places = 'Pilih minimal 1 tempat dari Katalog Tempat';
  if (!startPoint || startPoint.lat == null || startPoint.lon == null) errors.startPoint = 'Pilih titik awal';
  if (!startDate) {
    errors.startDate = 'Pilih tanggal mulai';
  } else if (today) {
    const offset = diffDays(today, startDate);
    if (offset < 0 || offset > RULES.forecastDays) {
      errors.startDate = `Tanggal mulai harus antara hari ini dan ${RULES.forecastDays} hari ke depan`;
    }
  }
  const d = Number(days);
  if (!Number.isInteger(d) || d < 1 || d > RULES.maxDays) {
    errors.days = `Jumlah hari 1 sampai ${RULES.maxDays}`;
  }
  return errors;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REGION_RE = /^\d{2}\.\d{2}(\.\d{2})?$/; // kode Kemendagri: 32.73 atau 32.73.01
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Form Admin Tambah Tempat (aturan bisnis 9: koordinat, kode wilayah, kategori, jam buka, ruang terbuka wajib)
export function validatePlace(values) {
  const errors = {};
  if (!String(values.name || '').trim()) errors.name = 'Nama tempat wajib diisi';
  if (!SLUG_RE.test(String(values.id || ''))) errors.id = 'ID huruf kecil & tanda hubung, mis. curug-cimahi';

  const lat = Number(values.lat);
  const lon = Number(values.lon);
  if (values.lat === '' || Number.isNaN(lat)) errors.lat = 'Latitude wajib angka';
  if (values.lon === '' || Number.isNaN(lon)) errors.lon = 'Longitude wajib angka';
  if (!errors.lat && !errors.lon && !isInBandungRaya(lat, lon)) {
    errors.lat = 'Koordinat di luar Bandung Raya';
  }

  if (!REGION_RE.test(String(values.region_code || '').trim())) {
    errors.region_code = 'Format kode kecamatan, mis. 32.17.01';
  }
  if (!values.category) errors.category = 'Pilih kategori';

  if (!isValidTime(values.open)) errors.open = 'Format HH:MM';
  if (!isValidTime(values.close)) errors.close = 'Format HH:MM';
  if (!errors.open && !errors.close && toMinutes(values.open) >= toMinutes(values.close)) {
    errors.close = 'Jam tutup harus setelah jam buka';
  }
  if ((values.closedDays || []).length >= 7) errors.open = 'Minimal satu hari buka';

  const visit = Number(values.default_visit_min);
  if (!Number.isInteger(visit) || visit < 15 || visit > 480) {
    errors.default_visit_min = 'Lama kunjungan 15–480 menit';
  }
  if (values.verified_at && !DATE_RE.test(values.verified_at)) {
    errors.verified_at = 'Format YYYY-MM-DD';
  }
  if (typeof values.outdoor !== 'boolean') errors.outdoor = 'Tentukan ruang terbuka atau tertutup';
  return errors;
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

// 'Curug Cimahi' → 'curug-cimahi'
export function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
