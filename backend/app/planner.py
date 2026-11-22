"""Aturan penjadwalan (core domain): urutan nearest neighbor, pembagian hari,
validasi jam buka, peringatan hujan, dan daftar tidak terjadwal."""
from datetime import date, timedelta

from .services import haversine_km

WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
RAIN_THRESHOLD = 70
ALT_RADIUS_KM = 10
REASONS = {
    "CLOSED_ON_DAY": "Tempat tutup di semua hari perjalanan.",
    "OUTSIDE_OPENING_HOURS": "Tidak ada waktu tiba yang muat dalam jam buka.",
    "DAY_LIMIT_EXCEEDED": "Tidak muat dalam batas jam harian.",
}


def to_min(s: str) -> int:
    h, m = s.split(":")
    return int(h) * 60 + int(m)


def fmt(m: int) -> str:
    return f"{m // 60:02d}:{m % 60:02d}"


def _km(a, b):
    return haversine_km(a["lat"], a["lon"], b["lat"], b["lon"])


def order(places: list, start: dict, locked_pos: dict) -> list:
    """Stop terkunci tetap di posisinya, sisanya diisi tempat terdekat (nearest neighbor)."""
    n = len(places)
    slots = [None] * n
    for p in places:
        i = locked_pos.get(p["id"])
        if i is not None and i < n and slots[i] is None:
            slots[i] = p
    used = {p["id"] for p in slots if p}
    free = [p for p in places if p["id"] not in used]
    out, pos = [], start
    for i in range(n):
        p = slots[i]
        if p is None:
            p = min(free, key=lambda q: _km(pos, q))
            free.remove(p)
        out.append(p)
        pos = p
    return out


def snapshot(p: dict, captured_at: str) -> dict:
    keys = ("id", "name", "lat", "lon", "region_code", "category", "outdoor", "opening_hours", "default_visit_min")
    return {**{k: p[k] for k in keys}, "captured_at": captured_at}


def schedule(seq, *, start, start_date: date, days, mode, day_start, max_hours, visit_min,
             locked, catalog, route_fn, weather_fn, captured_at):
    queue = [(p, None) for p in seq]
    planned_ids = {p["id"] for p in seq}
    day_plans = []
    for d in range(days):
        dt = start_date + timedelta(days=d)
        wd = WEEKDAYS[dt.weekday()]
        t = t0 = to_min(day_start)
        limit = t0 + max_hours * 60
        pos, pos_id = start, "start"
        stops, legs, rest = [], [], []
        for p, _ in queue:
            visit = visit_min.get(p["id"], p["default_visit_min"])
            oh = p.get("opening_hours")
            if oh is not None:
                rng = oh.get(wd)
                if not rng:
                    rest.append((p, "CLOSED_ON_DAY"))
                    continue
                op, cl = to_min(rng[0]), to_min(rng[1])
            else:
                op, cl = 0, 24 * 60
            leg = route_fn(pos["lat"], pos["lon"], p["lat"], p["lon"], mode)
            arr = t + round(leg["duration_s"] / 60)
            begin = max(arr, op)
            end = begin + visit
            if end > cl:
                rest.append((p, "OUTSIDE_OPENING_HOURS"))
                continue
            if end > limit:
                rest.append((p, "DAY_LIMIT_EXCEEDED"))
                continue
            legs.append({"from": pos_id, "to": p["id"], **leg})
            stops.append({"place_snapshot": snapshot(p, captured_at), "arrival_time": fmt(arr),
                          "start_time": fmt(begin), "departure_time": fmt(end), "wait_min": begin - arr,
                          "visit_min": visit, "locked": p["id"] in locked})
            t, pos, pos_id = end, p, p["id"]
        queue = rest

        weather, warnings = None, []
        if stops:
            first = stops[0]["place_snapshot"]
            weather = weather_fn(first["lat"], first["lon"], dt.isoformat())
            if weather is None:
                warnings.append({"code": "WEATHER_UNAVAILABLE",
                                 "message": "Prakiraan cuaca belum tersedia untuk tanggal ini."})
            elif (weather.get("precipitation_probability") or 0) >= RAIN_THRESHOLD:
                for s in stops:
                    sp = s["place_snapshot"]
                    if not sp["outdoor"]:
                        continue
                    alts = sorted(
                        ({"place_id": c["id"], "name": c["name"], "distance_km": round(_km(sp, c), 1)}
                         for c in catalog.values()
                         if not c["outdoor"] and c["id"] not in planned_ids and _km(sp, c) <= ALT_RADIUS_KM),
                        key=lambda a: a["distance_km"])[:3]
                    warnings.append({"code": "RAIN_RISK", "place_id": sp["id"],
                                     "message": f"Peluang hujan {weather['precipitation_probability']}% di tempat ruang terbuka.",
                                     "alternatives": alts})
        day_plans.append({"date": dt.isoformat(), "weather": weather, "stops": stops, "legs": legs,
                          "warnings": warnings})

    unscheduled = [{"place_id": p["id"], "name": p["name"], "reason": r, "message": REASONS[r]} for p, r in queue]
    return day_plans, unscheduled


def needs_refresh(plan: dict, catalog: dict) -> bool:
    keys = ("lat", "lon", "opening_hours", "default_visit_min", "outdoor")
    for day in plan["day_plans"]:
        for s in day["stops"]:
            sp, cur = s["place_snapshot"], catalog.get(s["place_snapshot"]["id"])
            if cur is None or any(sp[k] != cur[k] for k in keys):
                return True
    return False
