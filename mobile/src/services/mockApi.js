// API tiruan untuk mode dummy (EXPO_PUBLIC_USE_DUMMY=true).
// Bentuk respons dibuat sama dengan microservice asli, termasuk aturan penjadwalan
// yang disederhanakan: nearest neighbor, batas jam per hari, jam buka, RAIN_RISK.
import { DUMMY_PLACES, DUMMY_TEMPLATES, DUMMY_STORIES, DUMMY_EVENTS, DUMMY_FOOD, DUMMY_USER, DUMMY_PASSWORD } from '../data/dummy';
import { RULES } from '../data/constants';
import { addDays, toISODate, diffDays } from '../utils/format';
import { getHoursForDate, toMinutes } from '../utils/openingHours';
import { haversineKm } from '../utils/geo';
import { parseFreeText } from '../utils/ajaib';
import { ApiError, friendlyMessage } from './errors';

const DELAY = 450;
const wait = (ms = DELAY) => new Promise((r) => setTimeout(r, ms));
const fail = (status, code) => {
  throw new ApiError(friendlyMessage(code), { status, code });
};

const store = {
  places: [...DUMMY_PLACES],
  templates: [...DUMMY_TEMPLATES],
  itineraries: [],
  users: [{ ...DUMMY_USER, password: DUMMY_PASSWORD }],
  seq: 1,
};

const tokenOf = (user) => `dummy.${user.id}`;
function userFromToken(token) {
  const user = store.users.find((u) => tokenOf(u) === token);
  if (!user) fail(401, 'UNAUTHORIZED');
  const { password, ...safe } = user;
  return safe;
}

// ---- penjadwalan sederhana -------------------------------------------------
const pad = (n) => String(n).padStart(2, '0');
const hhmm = (min) => `${pad(Math.floor(min / 60))}:${pad(Math.round(min % 60))}`;

function travel(a, b, mode) {
  const km = haversineKm(a, b) * 1.3; // garis lurus × 1,3 (sama dengan fallback backend)
  const speed = mode === 'walking' ? 4.5 : 30;
  return { distance_m: Math.round(km * 1000), duration_s: Math.round((km / speed) * 3600) };
}

function weatherFor(date) {
  // Hash sederhana dari tanggal → peluang hujan yang bervariasi tapi tetap sama untuk tanggal yang sama
  let seed = 2166136261;
  for (const ch of date) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619) >>> 0;
  const prob = seed % 100;
  return {
    date,
    precipitation_probability: prob,
    precipitation_mm: Math.round(prob / 7),
    temp_min: 18 + (seed % 3),
    temp_max: 24 + (Math.abs(seed) % 5),
    weather_code: prob >= 70 ? 63 : prob >= 40 ? 3 : 1,
    fetched_at: new Date().toISOString(),
    source: 'open-meteo',
  };
}

function snapshot(p) {
  return { id: p.id, name: p.name, category: p.category, lat: p.lat, lon: p.lon, outdoor: p.outdoor, region_code: p.region_code };
}

function schedule({ place_ids, start_point, start_date, days, travel_mode = 'driving', max_hours = RULES.defaultMaxHours }, { order, locked = [], visitMin = {} } = {}) {
  const ids = order && order.length ? order : place_ids;
  const pool = ids.map((id) => store.places.find((p) => p.id === id)).filter(Boolean);
  const keepOrder = Boolean(order && order.length);
  const remaining = [...pool];
  const day_plans = [];
  const tried = {};

  for (let d = 0; d < days; d += 1) {
    const date = addDays(start_date, d);
    const dayStart = 8 * 60;
    const dayEnd = dayStart + max_hours * 60;
    let t = dayStart;
    let here = { id: 'start', ...start_point };
    const stops = [];
    const legs = [];
    let progressed = true;
    while (progressed && remaining.length) {
      progressed = false;
      const candidates = keepOrder
        ? remaining
        : [...remaining].sort((a, b) => haversineKm(here, a) - haversineKm(here, b));
      for (const place of candidates) {
        tried[place.id] = tried[place.id] || { closed: 0, hours: 0, limit: 0 };
        const hours = getHoursForDate(place.opening_hours, date);
        if (!hours) { tried[place.id].closed += 1; if (keepOrder) break; continue; }
        const leg = travel(here, place, travel_mode);
        const arrival = t + leg.duration_s / 60;
        const start = Math.max(arrival, toMinutes(hours.open));
        const visit = visitMin[place.id] || place.default_visit_min;
        const end = start + visit;
        if (end > toMinutes(hours.close)) { tried[place.id].hours += 1; if (keepOrder) break; continue; }
        if (end > dayEnd) { tried[place.id].limit += 1; if (keepOrder) break; continue; }
        legs.push({ from: here.id, to: place.id, ...leg, source: 'estimate' });
        stops.push({
          place_snapshot: snapshot(place),
          arrival_time: hhmm(arrival),
          start_time: hhmm(start),
          departure_time: hhmm(end),
          wait_min: Math.max(0, Math.round(start - arrival)),
          visit_min: visit,
          locked: locked.includes(place.id),
        });
        remaining.splice(remaining.indexOf(place), 1);
        here = place;
        t = end;
        progressed = true;
        break;
      }
    }
    const weather = weatherFor(date);
    const warnings = [];
    const outdoorStop = stops.find((s) => s.place_snapshot.outdoor);
    if (weather.precipitation_probability >= RULES.rainThreshold && outdoorStop) {
      const usedIds = new Set(ids);
      const origin = outdoorStop.place_snapshot;
      const alternatives = store.places
        .filter((p) => !p.outdoor && !usedIds.has(p.id))
        .map((p) => ({ place_id: p.id, name: p.name, distance_km: Number(haversineKm(origin, p).toFixed(1)) }))
        .filter((a) => a.distance_km <= RULES.alternativeRadiusKm)
        .sort((a, b) => a.distance_km - b.distance_km)
        .slice(0, 3);
      warnings.push({
        code: 'RAIN_RISK',
        place_id: origin.id,
        message: `Peluang hujan ${weather.precipitation_probability}% di tempat ruang terbuka.`,
        alternatives,
      });
    }
    day_plans.push({ date, weather, stops, legs, warnings });
  }

  const unscheduled = remaining.map((p) => {
    const tr = tried[p.id] || { closed: 0, hours: 0, limit: 0 };
    let reason = 'DAY_LIMIT_EXCEEDED';
    if (tr.closed >= days) reason = 'CLOSED_ON_DAY';
    else if (tr.hours > tr.limit) reason = 'OUTSIDE_OPENING_HOURS';
    return { place_id: p.id, name: p.name, place_snapshot: snapshot(p), reason };
  });
  return { day_plans, unscheduled };
}

function makeItinerary(payload, owner) {
  const id = `it${String(store.seq++).padStart(4, '0')}`;
  return {
    id,
    owner_id: owner.id,
    title: payload.title || null,
    status: 'draft',
    start_date: payload.start_date,
    days: payload.days,
    travel_mode: payload.travel_mode,
    start_point: payload.start_point,
    max_hours: payload.max_hours || RULES.defaultMaxHours,
    place_ids: payload.place_ids,
    needs_refresh: false,
    ...schedule(payload),
  };
}

let seeded = false;
function seed() {
  if (seeded) return;
  seeded = true;
  const owner = store.users[0];
  const today = toISODate();
  const base = { start_point: { lat: -6.9218, lon: 107.6071 }, travel_mode: 'driving' };
  const a = makeItinerary({ ...base, title: 'Alam & Budaya Lembang', start_date: addDays(today, 7), days: 2, place_ids: ['curug-malela', 'gua-pawon', 'tebing-keraton', 'observatorium-bosscha', 'kawah-putih'] }, owner);
  const b = makeItinerary({ ...base, title: 'Akhir pekan Ciwidey', start_date: addDays(today, 14), days: 2, place_ids: ['kawah-putih', 'situ-patenggang', 'curug-dago', 'museum-geologi'] }, owner);
  b.status = 'selesai';
  const c = makeItinerary({ ...base, title: 'Susur gua & tebing', start_date: addDays(today, 3), days: 1, place_ids: ['gua-pawon', 'tebing-keraton', 'curug-dago'] }, owner);
  c.needs_refresh = true;
  store.itineraries.push(a, b, c);
}

// ---- endpoint tiruan --------------------------------------------------------
export async function health() {
  await wait(150);
  return { status: 'ok', service: 'bolang', version: '1.1.0 (dummy)' };
}

export async function login(email, password) {
  await wait();
  const user = store.users.find((u) => u.email === String(email).trim().toLowerCase());
  if (!user || user.password !== password) fail(401, 'INVALID_CREDENTIALS');
  const { password: _pw, ...safe } = user;
  return { token: tokenOf(user), user: safe };
}

export async function register(name, email, password) {
  await wait();
  const mail = String(email).trim().toLowerCase();
  if (store.users.some((u) => u.email === mail)) fail(400, 'EMAIL_TAKEN');
  const user = { id: `u${store.seq++}`, name, email: mail, role: 'user', password };
  store.users.push(user);
  const { password: _pw, ...safe } = user;
  return safe;
}

export async function getMe(token) {
  await wait(150);
  return userFromToken(token);
}

export async function getPlaces(params = {}) {
  await wait();
  let items = store.places;
  if (params.category) items = items.filter((p) => p.category === params.category);
  if (params.region_code) items = items.filter((p) => p.region_code.startsWith(params.region_code));
  if (params.outdoor !== undefined && params.outdoor !== null) {
    const want = String(params.outdoor) === 'true';
    items = items.filter((p) => p.outdoor === want);
  }
  return { items, total: items.length, page: 1 };
}

export async function getPlace(id) {
  await wait(250);
  const p = store.places.find((x) => x.id === id);
  if (!p) fail(404, 'PLACE_NOT_FOUND');
  return p;
}

export async function createPlace(token, place) {
  await wait();
  const user = userFromToken(token);
  if (user.role !== 'admin') fail(403, 'FORBIDDEN');
  if (store.places.some((p) => p.id === place.id)) fail(400, 'PLACE_EXISTS');
  store.places.push(place);
  return place;
}

export async function createItinerary(token, payload) {
  await wait(1600);
  const user = userFromToken(token);
  const offset = diffDays(toISODate(), payload.start_date);
  if (offset < 0 || offset > RULES.forecastDays) fail(422, 'DATE_OUT_OF_RANGE');
  const it = makeItinerary(payload, user);
  store.itineraries.unshift(it);
  return it;
}

export async function getItineraries(token) {
  seed();
  await wait();
  const user = userFromToken(token);
  return store.itineraries.filter((i) => i.owner_id === user.id || user.id === 'u-demo');
}

export async function getItinerary(token, id) {
  seed();
  await wait();
  userFromToken(token);
  const it = store.itineraries.find((i) => i.id === id);
  if (!it) fail(404, 'NOT_FOUND');
  return it;
}

export async function updateItinerary(token, id, patch) {
  await wait(700);
  userFromToken(token);
  const idx = store.itineraries.findIndex((i) => i.id === id);
  if (idx < 0) fail(404, 'NOT_FOUND');
  const it = store.itineraries[idx];
  let next = { ...it };
  if (patch.status) next.status = patch.status;
  if (patch.order || patch.locked || patch.visit_min) {
    next = { ...next, needs_refresh: false, ...schedule(it, { order: patch.order, locked: patch.locked, visitMin: patch.visit_min }) };
  }
  store.itineraries[idx] = next;
  return next;
}

export async function shareItinerary(token, id) {
  await wait(600);
  userFromToken(token);
  const it = store.itineraries.find((i) => i.id === id);
  if (!it) fail(404, 'NOT_FOUND');
  if (it.status !== 'selesai') fail(400, 'NOT_FINISHED');
  const tpl = {
    id: `tpl-${it.id}`,
    source_itinerary_id: it.id,
    title: it.title,
    days: it.days,
    place_ids: it.day_plans.flatMap((d) => d.stops.map((s) => s.place_snapshot.id)),
    featured: false,
    partner_label: null,
  };
  store.templates = [tpl, ...store.templates.filter((t) => t.id !== tpl.id)];
  return tpl;
}

export async function getTemplates(params = {}) {
  await wait();
  let items = store.templates;
  if (params.place_id) items = items.filter((t) => t.place_ids.includes(params.place_id));
  if (params.days) items = items.filter((t) => t.days === Number(params.days));
  return items;
}

export async function getWeather(lat, lon, date) {
  await wait(200);
  return { lat, lon, ...weatherFor(date) };
}

export async function estimateRoute(from, to, mode = 'driving') {
  await wait(200);
  return { ...travel(from, to, mode), source: 'estimate' };
}

// ---- Orkestrasi Rencana (tiruan) --------------------------------------------
export async function getStories(regionCodes = []) {
  await wait(600);
  const prefixes = regionCodes.map((c) => String(c).slice(0, 5));
  return DUMMY_STORIES.filter((s) => prefixes.some((p) => s.region_code.startsWith(p.slice(0, 5))));
}

export async function getEvents(regionCode, from, to) {
  await wait(700);
  const prefix = String(regionCode || '').slice(0, 5);
  return DUMMY_EVENTS.filter((e) => e.region_code.startsWith(prefix) && (!from || e.date >= from) && (!to || e.date <= to));
}

export async function getNearbyFood(lat, lon) {
  await wait(800);
  return DUMMY_FOOD.map((f) => ({ ...f, distance_m: Math.round(haversineKm({ lat, lon }, f) * 1000) || f.distance_m }))
    .sort((a, b) => a.distance_m - b.distance_m)
    .slice(0, 3);
}

export async function parsePlan(text) {
  await wait(1200);
  return parseFreeText(text, store.places);
}
