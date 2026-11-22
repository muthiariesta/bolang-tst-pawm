// Jarak garis lurus (haversine) dalam km.
export function haversineKm(a, b) {
  if (!a || !b) return null;
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Kotak kira-kira Bandung Raya (Kota Bandung, Kab. Bandung, Kab. Bandung Barat, Cimahi).
export const BANDUNG_RAYA = { minLat: -7.4, maxLat: -6.6, minLon: 107.1, maxLon: 108.0 };

export function isInBandungRaya(lat, lon) {
  return lat >= BANDUNG_RAYA.minLat && lat <= BANDUNG_RAYA.maxLat && lon >= BANDUNG_RAYA.minLon && lon <= BANDUNG_RAYA.maxLon;
}

// Ubah koordinat menjadi titik di kotak gambar (untuk RouteMap). Menjaga rasio & memberi margin.
export function projectPoints(points, width, height, padding = 28) {
  if (!points.length) return [];
  const lats = points.map((p) => p.lat);
  const lons = points.map((p) => p.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const spanLat = Math.max(maxLat - minLat, 0.005);
  const spanLon = Math.max(maxLon - minLon, 0.005);
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const scale = Math.min(innerW / spanLon, innerH / spanLat);
  const offsetX = padding + (innerW - spanLon * scale) / 2;
  const offsetY = padding + (innerH - spanLat * scale) / 2;
  return points.map((p) => ({
    ...p,
    x: offsetX + (p.lon - minLon) * scale,
    y: offsetY + (maxLat - p.lat) * scale,
  }));
}

// Path SVG halus (kurva) melalui titik-titik.
export function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i += 1) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const cx = (p0.x + p1.x) / 2;
    d += ` C ${cx.toFixed(1)} ${p0.y.toFixed(1)}, ${cx.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }
  return d;
}
