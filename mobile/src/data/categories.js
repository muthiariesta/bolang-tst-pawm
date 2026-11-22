// Kategori Katalog Tempat. `key` = nilai field `category` di API.
// `tone` mengikuti variabel alias category/* di Figma:
// curug → biru, situs sejarah → ungu, kawah → amber, alam terbuka → hijau.
export const CATEGORIES = [
  { key: 'curug', label: 'Curug', tone: 'blue', icon: 'water-outline', image: 'curug' },
  { key: 'danau', label: 'Danau', tone: 'blue', icon: 'boat-outline', image: 'kawah' },
  { key: 'kawah', label: 'Kawah', tone: 'amber', icon: 'flame-outline', image: 'kawah' },
  { key: 'tebing', label: 'Tebing & bukit', tone: 'green', icon: 'trail-sign-outline', image: 'tebing' },
  { key: 'kebun', label: 'Kebun & hutan', tone: 'green', icon: 'leaf-outline', image: 'tebing' },
  { key: 'situs_sejarah', label: 'Situs sejarah', tone: 'purple', icon: 'library-outline', image: 'gua' },
  { key: 'museum', label: 'Museum', tone: 'purple', icon: 'business-outline', image: 'gua' },
  { key: 'rekreasi', label: 'Rekreasi', tone: 'amber', icon: 'happy-outline', image: 'tebing' },
];

const BY_KEY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

// Label cadangan untuk kategori yang belum terdaftar di aplikasi (mis. ditambah admin).
function humanize(key = '') {
  const text = String(key).replace(/[-_]+/g, ' ').trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : 'Lainnya';
}

export function getCategory(key) {
  return BY_KEY[key] || { key, label: humanize(key), tone: 'neutral', icon: 'location-outline', image: 'tebing' };
}

export function getCategoryLabel(key) {
  return getCategory(key).label;
}

// Chip "Ruang terbuka" memakai field `outdoor`, bukan kategori.
export const OUTDOOR_FILTER = { key: '__outdoor', label: 'Ruang terbuka' };
export const ALL_FILTER = { key: '__all', label: 'Semua' };
