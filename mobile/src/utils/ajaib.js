// Parser sederhana untuk mode dummy Rencana Ajaib (tanpa model bahasa).
// Di mode server, teks dikirim ke Orkestrasi Rencana yang memakai model bahasa.
// Aturan bisnis 8: hasil apa pun HANYA boleh memuat tempat dari Katalog Tempat.

const AREAS = [
  { key: 'lembang', label: 'Lembang', regions: ['32.17'] },
  { key: 'ciwidey', label: 'Ciwidey', regions: ['32.04'] },
  { key: 'dago', label: 'Dago', regions: ['32.73'] },
  { key: 'kota', label: 'Kota Bandung', regions: ['32.73'] },
  { key: 'bandung barat', label: 'Bandung Barat', regions: ['32.17'] },
];

const INTERESTS = [
  { key: 'alam', words: ['alam', 'hutan', 'tebing', 'bukit', 'kebun'], categories: ['tebing', 'kebun', 'danau'] },
  { key: 'curug', words: ['curug', 'air terjun'], categories: ['curug'] },
  { key: 'budaya', words: ['budaya', 'sejarah', 'museum', 'heritage'], categories: ['situs_sejarah', 'museum'] },
  { key: 'kawah', words: ['kawah', 'gunung', 'vulkan'], categories: ['kawah'] },
  { key: 'santai', words: ['santai', 'keluarga', 'anak'], categories: ['rekreasi', 'kebun'] },
];

const LABEL = { alam: 'Alam', curug: 'Curug', budaya: 'Budaya', kawah: 'Kawah', santai: 'Santai' };

export function parseFreeText(text, catalog = []) {
  const t = String(text || '').toLowerCase();
  const dayMatch = t.match(/(\d+)\s*hari/) || t.match(/(se|satu|dua|tiga)\s*hari/);
  const WORD_NUM = { se: 1, satu: 1, dua: 2, tiga: 3 };
  let days = 1;
  if (dayMatch) days = Number(dayMatch[1]) || WORD_NUM[dayMatch[1]] || 1;
  days = Math.min(Math.max(days, 1), 7);

  const area = AREAS.find((a) => t.includes(a.key)) || null;
  const interests = INTERESTS.filter((i) => i.words.some((w) => t.includes(w)));
  const startFromCity = /kota|pusat|alun|stasiun/.test(t);

  const wantedCats = new Set(interests.flatMap((i) => i.categories));
  const inArea = (p) => !area || area.regions.some((r) => String(p.region_code || '').startsWith(r));
  const inInterest = (p) => !wantedCats.size || wantedCats.has(p.category);

  // Prioritas: cocok area & minat → cocok minat saja → cocok area saja
  const ordered = [...catalog.filter((p) => inArea(p) && inInterest(p)), ...catalog.filter((p) => inInterest(p) && !inArea(p)), ...catalog.filter((p) => inArea(p) && !inInterest(p))];
  const maxPlaces = days * 3;
  const placeIds = [...new Set(ordered.map((p) => p.id))].slice(0, maxPlaces);

  return {
    days,
    area: area ? area.label : 'Bandung Raya',
    interests: interests.map((i) => LABEL[i.key]),
    start_label: startFromCity ? 'Pusat kota Bandung' : 'Alun-Alun Bandung',
    place_ids: placeIds,
  };
}

// Saring hasil model bahasa: buang place_id yang tidak ada di katalog.
export function keepCatalogIds(placeIds = [], catalog = []) {
  const known = new Set(catalog.map((p) => p.id));
  return placeIds.filter((id) => known.has(id));
}
