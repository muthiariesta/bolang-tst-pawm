"""Adapter (ACL) ke OSRM dan Open-Meteo: cache, timeout 5 detik, retry 1 kali, fallback."""
import datetime
import math
import time

import httpx

from .config import WIB
from .errors import AppError

WEATHER_TTL, ROUTE_TTL, COOLDOWN = 1800, 86400, 60
SPEED_KMH = {"driving": 30, "walking": 4.5}
ROAD_FACTOR = {"driving": 1.3, "walking": 1.2}
_cache: dict = {}
_down_until: dict = {}


def reset():
    _cache.clear()
    _down_until.clear()


def _get(key, ttl):
    v = _cache.get(key)
    return v[1] if v and time.time() - v[0] < ttl else None


def _put(key, val):
    _cache[key] = (time.time(), val)


def _http_get(url, params=None):
    last = None
    for _ in range(2):
        try:
            r = httpx.get(url, params=params, timeout=5)
            r.raise_for_status()
            return r.json()
        except Exception as e:  # noqa: BLE001
            last = e
    raise last


def _call(upstream, url, params=None):
    """Kalau upstream baru saja gagal, jangan dipanggil lagi selama COOLDOWN detik."""
    if _down_until.get(upstream, 0) > time.time():
        raise RuntimeError(f"{upstream} sedang dianggap mati")
    try:
        return _http_get(url, params)
    except Exception:
        _down_until[upstream] = time.time() + COOLDOWN
        raise


def haversine_km(a_lat, a_lon, b_lat, b_lon):
    p = math.pi / 180
    h = (math.sin((b_lat - a_lat) * p / 2) ** 2
         + math.cos(a_lat * p) * math.cos(b_lat * p) * math.sin((b_lon - a_lon) * p / 2) ** 2)
    return 2 * 6371 * math.asin(math.sqrt(h))


def _day(j, i, lat, lon, fetched_at):
    d = j["daily"]
    pp = d["precipitation_probability_max"][i]
    return {"lat": lat, "lon": lon, "date": d["time"][i],
            "precipitation_probability": None if pp is None else int(round(pp)),
            "precipitation_mm": d["precipitation_sum"][i],
            "temp_min": d["temperature_2m_min"][i], "temp_max": d["temperature_2m_max"][i],
            "weather_code": d["weather_code"][i], "fetched_at": fetched_at}


def weather_range(lat, lon, start, end):
    """WeatherSnapshot per tanggal dari start sampai end (inklusif, format YYYY-MM-DD).
    Melempar AppError 503 kalau Open-Meteo mati dan ada tanggal yang belum pernah di-cache."""
    lat, lon = round(lat, 4), round(lon, 4)
    dates, cur = [], datetime.date.fromisoformat(start)
    while cur.isoformat() <= end:
        dates.append(cur.isoformat())
        cur += datetime.timedelta(days=1)
    key = lambda d: ("w", round(lat, 2), round(lon, 2), d)  # noqa: E731
    hits = {d: _get(key(d), WEATHER_TTL) for d in dates}
    if all(hits.values()):
        return [{**hits[d], "source": "cache"} for d in dates]
    try:
        j = _call("open-meteo", "https://api.open-meteo.com/v1/forecast", {
            "latitude": lat, "longitude": lon, "timezone": "Asia/Jakarta",
            "start_date": start, "end_date": end,
            "daily": "precipitation_probability_max,precipitation_sum,temperature_2m_max,temperature_2m_min,weather_code"})
        fetched = datetime.datetime.now(WIB).isoformat(timespec="seconds")
        out = []
        for i in range(len(j["daily"]["time"])):
            day = _day(j, i, lat, lon, fetched)
            _put(key(day["date"]), day)
            out.append({**day, "source": "open-meteo"})
        return out
    except Exception:
        old = [_cache.get(key(d)) for d in dates]
        if all(old):
            return [{**o[1], "source": "cache"} for o in old]
        raise AppError(503, "UPSTREAM_UNAVAILABLE", "Data cuaca sedang tidak tersedia. Coba lagi nanti.")


def weather(lat, lon, date):
    return weather_range(lat, lon, date, date)[0]


def route(a_lat, a_lon, b_lat, b_lon, mode="driving"):
    """RouteLeg: distance_m, duration_s, source (osrm | estimate | cache)."""
    key = ("r", mode, round(a_lat, 4), round(a_lon, 4), round(b_lat, 4), round(b_lon, 4))
    hit = _get(key, ROUTE_TTL)
    if hit:
        return {**hit, "source": "cache"}
    if mode == "driving":
        try:
            j = _call("osrm", f"https://router.project-osrm.org/route/v1/driving/{a_lon},{a_lat};{b_lon},{b_lat}",
                      {"overview": "false"})
            r = j["routes"][0]
            out = {"distance_m": round(r["distance"]), "duration_s": round(r["duration"])}
            _put(key, out)
            return {**out, "source": "osrm"}
        except Exception:
            pass
    km = haversine_km(a_lat, a_lon, b_lat, b_lon) * ROAD_FACTOR[mode]
    return {"distance_m": round(km * 1000), "duration_s": round(km / SPEED_KMH[mode] * 3600), "source": "estimate"}
