// Logika murni untuk data itinerary dari API (POST/GET /itineraries).
// Bentuk data mengikuti README backend:
// { id, status, start_date, days, needs_refresh, day_plans: [{ date, weather, stops, legs, warnings }], unscheduled }

export const REASON_LABELS = {
  CLOSED_ON_DAY: 'Tutup pada hari kunjungan',
  OUTSIDE_OPENING_HOURS: 'Tidak bisa dikunjungi di dalam jam buka',
  DAY_LIMIT_EXCEEDED: 'Tak muat di hari mana pun: melebihi batas jam per hari',
};

export function reasonLabel(code) {
  return REASON_LABELS[code] || code || 'Tidak bisa dijadwalkan';
}

export function stopPlaceId(stop) {
  return stop?.place_snapshot?.id ?? stop?.place_id;
}

export function stopName(stop) {
  return stop?.place_snapshot?.name ?? stop?.name ?? stopPlaceId(stop);
}

export function allStops(itinerary) {
  return (itinerary?.day_plans || []).flatMap((d) => d.stops || []);
}

export function placeCount(itinerary) {
  return allStops(itinerary).length + (itinerary?.unscheduled?.length || 0);
}

// Judul tidak disimpan backend; dibuat dari nama stop (atau `title` jika ada).
export function itineraryTitle(itinerary) {
  if (itinerary?.title) return itinerary.title;
  const names = allStops(itinerary).map(stopName).filter(Boolean);
  if (!names.length) return 'Itinerary baru';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names[0]} & ${names.length - 1} tempat lain`;
}

// 'draft' | 'selesai' | 'refresh'
export function statusOf(itinerary) {
  if (itinerary?.needs_refresh) return 'refresh';
  return itinerary?.status === 'selesai' ? 'selesai' : 'draft';
}

export const STATUS_LABELS = { draft: 'Draft', selesai: 'Selesai', refresh: 'Perlu disegarkan' };

// legs[i].from = id stop sebelumnya ('start' untuk titik awal).
// Leg "ke stop berikutnya" = leg yang berangkat dari stop ini.
export function legAfterStop(dayPlan, stopIndex) {
  const stops = dayPlan?.stops || [];
  const legs = dayPlan?.legs || [];
  const id = stopPlaceId(stops[stopIndex]);
  const byFrom = legs.find((l) => l.from === id);
  if (byFrom) return byFrom;
  // cadangan: urutan legs sejajar dengan stops, dengan legs[0] dari titik awal
  return stopIndex + 1 < stops.length ? legs[stopIndex + 1] || null : null;
}

export function rainWarning(dayPlan) {
  return (dayPlan?.warnings || []).find((w) => w.code === 'RAIN_RISK') || null;
}

// Pindahkan item dalam array tanpa mengubah array asli (immutable).
export function moveItem(list, from, to) {
  if (to < 0 || to >= list.length || from === to) return list;
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

// Payload PATCH { order, locked } dari state editor (array hari berisi stop).
export function buildReorderPayload(days) {
  const stops = days.flat();
  return {
    order: stops.map(stopPlaceId),
    locked: stops.filter((s) => s.locked).map(stopPlaceId),
  };
}

// Semua place_id dalam itinerary (terjadwal + tidak terjadwal), dengan satu tempat diganti.
export function replacePlaceIds(itinerary, oldId, newId) {
  const ids = [
    ...allStops(itinerary).map(stopPlaceId),
    ...(itinerary?.unscheduled || []).map((u) => u.place_id ?? u.place_snapshot?.id).filter(Boolean),
  ];
  const replaced = ids.map((id) => (id === oldId ? newId : id));
  return [...new Set(replaced)];
}

export function firstStopCategory(itinerary) {
  return allStops(itinerary)[0]?.place_snapshot?.category;
}

export function totalDistanceM(dayPlan) {
  return (dayPlan?.legs || []).reduce((sum, l) => sum + (Number(l.distance_m) || 0), 0);
}
