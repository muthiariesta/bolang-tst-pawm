// Semua panggilan server lewat file ini. Tidak ada URL API di file screen.
//   EXPO_PUBLIC_API_URL          → microservice Jelajah Rute (STB), mis. https://bolang.stei.fun/api
//   EXPO_PUBLIC_ORCHESTRATOR_URL → layanan integrasi Orkestrasi Rencana (kisah, acara, kuliner, Rencana Ajaib)
//   EXPO_PUBLIC_USE_DUMMY=true   → pakai data dummy (src/services/mockApi.js), tanpa server
import { ApiError, friendlyMessage } from './errors';
import * as mock from './mockApi';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/+$/, '');
const ORCHESTRATOR_URL = (process.env.EXPO_PUBLIC_ORCHESTRATOR_URL || '').replace(/\/+$/, '');
export const USE_DUMMY = process.env.EXPO_PUBLIC_USE_DUMMY === 'true';
const TIMEOUT_MS = 12000;

// { a: 1, b: undefined, c: 'x y' } → '?a=1&c=x%20y'
export function buildQuery(params = {}) {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(Array.isArray(v) ? v.join(',') : v)}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

async function request(path, options = {}) {
  const { method = 'GET', body, token, query, base = BASE_URL, signal, service = 'core' } = options;
  if (!base) {
    const code = service === 'orchestrator' ? 'NO_ORCHESTRATOR' : 'NO_BASE_URL';
    throw new ApiError(friendlyMessage(code), { code });
  }

  // Batas waktu + pembatalan dari luar (mis. tombol "Batalkan")
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), TIMEOUT_MS);
  const onAbort = () => controller.abort('cancelled');
  if (signal) signal.addEventListener('abort', onAbort);

  let res;
  try {
    res = await fetch(`${base}${path}${buildQuery(query)}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    if (signal?.aborted) throw new ApiError('Dibatalkan', { code: 'CANCELLED' });
    const code = controller.signal.aborted ? 'TIMEOUT' : 'NETWORK';
    throw new ApiError(friendlyMessage(code), { code });
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onAbort);
  }

  if (res.status === 204) return null; // berhasil tanpa isi
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  if (!res.ok) {
    // Jelajah Rute: { error, message }. Kisah & Kalender Budaya: { detail }.
    const code = data?.error || null;
    const fallback = data?.message || data?.detail || `Server error (${res.status})`;
    throw new ApiError(friendlyMessage(code, fallback), { status: res.status, code, details: data });
  }
  return data;
}

// Daftar dari API berbentuk { data: [...], page, total }
function unwrapList(data) {
  if (Array.isArray(data)) return { items: data, total: data.length, page: 1 };
  const items = data?.data ?? data?.items ?? [];
  return { items, total: data?.total ?? items.length, page: data?.page ?? 1 };
}

const orchestrator = (path, options = {}) => request(path, { ...options, base: ORCHESTRATOR_URL, service: 'orchestrator' });

// ---- Layanan ---------------------------------------------------------------
export function health() {
  return USE_DUMMY ? mock.health() : request('/health');
}

// ---- Akun ------------------------------------------------------------------
// POST /auth/login → { token, user? }. Jika user tidak disertakan, AuthContext memanggil /auth/me.
export async function login(email, password) {
  if (USE_DUMMY) return mock.login(email, password);
  const data = await request('/auth/login', { method: 'POST', body: { email: email.trim().toLowerCase(), password } });
  return { token: data.token ?? data.access_token, user: data.user ?? null };
}

export function register(name, email, password) {
  if (USE_DUMMY) return mock.register(name, email, password);
  return request('/auth/register', { method: 'POST', body: { name: name.trim(), email: email.trim().toLowerCase(), password } });
}

export function getMe(token) {
  return USE_DUMMY ? mock.getMe(token) : request('/auth/me', { token });
}

// ---- Katalog Tempat ----------------------------------------------------------
// Katalog sengaja kecil (40–60 tempat), jadi diambil sekaligus lalu difilter di aplikasi.
export async function getPlaces(params = {}) {
  if (USE_DUMMY) return mock.getPlaces(params);
  const data = await request('/places', { query: { limit: 100, page: 1, ...params } });
  return unwrapList(data);
}

export function getPlace(id) {
  return USE_DUMMY ? mock.getPlace(id) : request(`/places/${encodeURIComponent(id)}`);
}

export function createPlace(token, place) {
  return USE_DUMMY ? mock.createPlace(token, place) : request('/places', { method: 'POST', token, body: place });
}

// ---- Itinerary -----------------------------------------------------------------
// payload: { place_ids, start_point: {lat, lon}, start_date, days, travel_mode, max_hours?, title? }
export function createItinerary(token, payload, { signal } = {}) {
  return USE_DUMMY ? mock.createItinerary(token, payload) : request('/itineraries', { method: 'POST', token, body: payload, signal });
}

export async function getItineraries(token) {
  if (USE_DUMMY) return mock.getItineraries(token);
  return unwrapList(await request('/itineraries', { token })).items;
}

export function getItinerary(token, id) {
  return USE_DUMMY ? mock.getItinerary(token, id) : request(`/itineraries/${encodeURIComponent(id)}`, { token });
}

// patch: { order?, locked?, visit_min?, status? }
export function updateItinerary(token, id, patch) {
  return USE_DUMMY
    ? mock.updateItinerary(token, id, patch)
    : request(`/itineraries/${encodeURIComponent(id)}`, { method: 'PATCH', token, body: patch });
}

export function shareItinerary(token, id) {
  return USE_DUMMY ? mock.shareItinerary(token, id) : request(`/itineraries/${encodeURIComponent(id)}/share`, { method: 'POST', token });
}

// ---- Template ------------------------------------------------------------------
export async function getTemplates(params = {}) {
  if (USE_DUMMY) return mock.getTemplates(params);
  return unwrapList(await request('/templates', { query: params })).items;
}

// ---- Rute & cuaca publik -----------------------------------------------------
export function getWeather(lat, lon, date, endDate) {
  if (USE_DUMMY) return mock.getWeather(lat, lon, date);
  return request('/weather', { query: { lat, lon, date, end_date: endDate } });
}

export function estimateRoute(from, to, mode = 'driving') {
  if (USE_DUMMY) return mock.estimateRoute(from, to, mode);
  return request('/route/estimate', { method: 'POST', body: { from, to, mode } });
}

// ---- Orkestrasi Rencana (di luar STB) ---------------------------------------
// Kontrak usulan, lihat README bagian "Integrasi". Setiap bagian dipanggil terpisah
// agar satu layanan yang mati hanya menyembunyikan bagiannya sendiri.
const listOf = (data) => (Array.isArray(data) ? data : data?.data ?? data?.items ?? []);

export async function getStories(regionCodes = []) {
  if (USE_DUMMY) return mock.getStories(regionCodes);
  return listOf(await orchestrator('/context/stories', { query: { region_codes: regionCodes } }));
}

export async function getEvents(regionCode, from, to) {
  if (USE_DUMMY) return mock.getEvents(regionCode, from, to);
  return listOf(await orchestrator('/context/events', { query: { region_code: regionCode, from, to } }));
}

export async function getNearbyFood(lat, lon, radiusM = 3000) {
  if (USE_DUMMY) return mock.getNearbyFood(lat, lon);
  return listOf(await orchestrator('/context/food', { query: { lat, lon, radius_m: radiusM } }));
}

// Teks bebas → { days, area, interests, start_label, place_ids }
export function parsePlan(text) {
  if (USE_DUMMY) return mock.parsePlan(text);
  return orchestrator('/context/plan-parse', { method: 'POST', body: { text } });
}
