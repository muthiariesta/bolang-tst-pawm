import os
import tempfile

os.environ["DB_PATH"] = os.path.join(tempfile.mkdtemp(), "t.db")
os.environ["ADMIN_EMAIL"], os.environ["ADMIN_PASSWORD"] = "admin@jr.test", "adminpass123"
os.environ["JWT_SECRET"] = "x" * 48

from datetime import timedelta  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app import config, main, services  # noqa: E402
from app.main import app  # noqa: E402


def offline(u, p=None):
    raise RuntimeError("offline")


def fake_meteo(prob):
    from datetime import date as D
    def f(u, p=None):
        if "open-meteo" not in u:
            raise RuntimeError("offline")
        a, b = D.fromisoformat(p["start_date"]), D.fromisoformat(p["end_date"])
        days = [(a + timedelta(days=i)).isoformat() for i in range((b - a).days + 1)]
        n = len(days)
        return {"daily": {"time": days, "precipitation_probability_max": [prob] * n, "precipitation_sum": [12.4] * n,
                          "temperature_2m_max": [27.1] * n, "temperature_2m_min": [19.5] * n, "weather_code": [63] * n}}
    return f


@pytest.fixture(scope="module")
def c():
    with TestClient(app) as cl:
        yield cl


@pytest.fixture(autouse=True)
def fresh(monkeypatch):
    services.reset()
    main._hits.clear()
    monkeypatch.setattr(services, "_http_get", offline)


def login(c, email, pw):
    return {"Authorization": "Bearer " + c.post("/api/auth/login", json={"email": email, "password": pw}).json()["token"]}


def user(c, email):
    c.post("/api/auth/register", json={"email": email, "password": "rahasia123"})
    return login(c, email, "rahasia123")


def next_weekday(wd):  # 0 = Senin
    d = config.today() + timedelta(days=1)
    while d.weekday() != wd:
        d += timedelta(days=1)
    return d.isoformat()


START = {"lat": -6.9218, "lon": 107.6071}


def test_health_both_prefixes(c):
    assert c.get("/health").json()["status"] == "ok"
    assert c.get("/api/health").status_code == 200


def test_places_filters(c):
    j = c.get("/api/places").json()
    assert j["total"] == 5 and j["page"] == 1
    assert c.get("/api/places?outdoor=false").json()["total"] == 2
    assert c.get("/api/places?region_code=32.73").json()["total"] == 3
    assert c.get("/api/places/museum-geologi").json()["opening_hours"]["fri"] is None
    assert c.get("/api/places/xxx").json()["error"] == "NOT_FOUND"


def test_authn_and_roles(c):
    b = {"email": "a@b.co", "password": "rahasia123"}
    assert c.post("/api/auth/register", json=b).status_code == 201
    assert c.post("/api/auth/register", json=b).json()["error"] == "EMAIL_TAKEN"
    assert c.post("/api/auth/login", json={**b, "password": "salah"}).json()["error"] == "INVALID_CREDENTIALS"
    h = login(c, b["email"], b["password"])
    assert c.get("/api/auth/me", headers=h).json()["role"] == "user"
    assert c.get("/api/auth/me", headers={"Authorization": "Bearer palsu"}).status_code == 401
    p = {"id": "tes-tempat", "name": "Tes", "lat": -6.9, "lon": 107.6, "region_code": "32.73.02",
         "category": "taman", "default_visit_min": 60, "outdoor": True,
         "opening_hours": {d: ["08:00", "17:00"] for d in ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]}}
    assert c.post("/api/places", json=p).status_code == 401
    assert c.post("/api/places", json=p, headers=h).status_code == 403
    adm = login(c, "admin@jr.test", "adminpass123")
    assert c.post("/api/places", json={**p, "region_code": "32.73"}, headers=adm).status_code == 422
    assert c.post("/api/places", json=p, headers=adm).status_code == 201


def test_api_key_lifecycle(c):
    adm = login(c, "admin@jr.test", "adminpass123")
    assert c.post("/api/admin/api-keys", json={"name": "kisah"}, headers=user(c, "u2@b.co")).status_code == 403
    k = c.post("/api/admin/api-keys", json={"name": "kisah"}, headers=adm).json()
    assert k["api_key"].startswith("jr_")
    assert c.get("/api/places", headers={"X-API-Key": k["api_key"]}).status_code == 200
    assert c.get("/api/places", headers={"X-API-Key": "jr_salah"}).json()["error"] == "INVALID_API_KEY"
    listed = c.get("/api/admin/api-keys", headers=adm).json()["data"]
    assert "api_key" not in listed[0] and listed[0]["last_used_at"]
    c.delete(f"/api/admin/api-keys/{k['id']}", headers=adm)
    assert c.get("/api/places", headers={"X-API-Key": k["api_key"]}).status_code == 401


def test_rate_limit(c):
    for _ in range(config.RATE_LIMIT):
        c.get("/api/places/curug-dago")
    assert c.get("/api/places/curug-dago").json()["error"] == "RATE_LIMITED"


def test_itinerary_schedule_ownership_template(c):
    h, other = user(c, "owner@b.co"), user(c, "other@b.co")
    body = {"place_ids": ["trans-studio-bandung", "museum-geologi", "curug-dago"], "start_point": START,
            "start_date": next_weekday(0), "days": 1}
    assert c.post("/api/itineraries", json=body).status_code == 401
    it = c.post("/api/itineraries", json=body, headers=h).json()
    day = it["day_plans"][0]
    names = [s["place_snapshot"]["id"] for s in day["stops"]]
    assert set(names) | {u["place_id"] for u in it["unscheduled"]} == set(body["place_ids"])
    assert all(leg["source"] == "estimate" for leg in day["legs"])
    for s in day["stops"]:  # waktu mulai kunjungan di dalam jam buka
        rng = s["place_snapshot"]["opening_hours"]["mon"]
        assert rng[0] <= s["start_time"] and s["departure_time"] <= rng[1]
    # otorisasi pemilik
    assert c.get(f"/api/itineraries/{it['id']}", headers=other).json()["error"] == "FORBIDDEN"
    assert c.patch(f"/api/itineraries/{it['id']}", json={"status": "selesai"}, headers=other).status_code == 403
    assert c.get("/api/itineraries", headers=other).json()["total"] == 0
    # belum selesai -> tidak bisa dibagikan
    assert c.post(f"/api/itineraries/{it['id']}/share", headers=h).json()["error"] == "NOT_FINISHED"
    assert c.patch(f"/api/itineraries/{it['id']}", json={"status": "selesai"}, headers=h).json()["status"] == "selesai"
    t = c.post(f"/api/itineraries/{it['id']}/share", headers=h).json()
    assert "owner_id" not in t and t["days"] == 1
    assert c.get("/api/templates?place_id=curug-dago").json()["total"] == 1


def test_closed_day_goes_unscheduled(c):
    h = user(c, "fri@b.co")
    it = c.post("/api/itineraries", headers=h, json={"place_ids": ["museum-geologi"], "start_point": START,
                                                      "start_date": next_weekday(4), "days": 1}).json()
    assert it["unscheduled"][0]["reason"] == "CLOSED_ON_DAY"


def test_day_limit_moves_to_next_day(c):
    h = user(c, "limit@b.co")
    it = c.post("/api/itineraries", headers=h, json={
        "place_ids": ["trans-studio-bandung", "tangkuban-parahu", "orchid-forest-cikole", "curug-dago"],
        "start_point": START, "start_date": next_weekday(5), "days": 2, "max_hours": 6}).json()
    per_day = [len(d["stops"]) for d in it["day_plans"]]
    assert per_day[0] >= 1 and per_day[1] >= 1


def test_lock_and_reorder(c):
    h = user(c, "lock@b.co")
    it = c.post("/api/itineraries", headers=h, json={
        "place_ids": ["curug-dago", "museum-geologi", "trans-studio-bandung"],
        "start_point": START, "start_date": next_weekday(0), "days": 1}).json()
    new = list(reversed(it["order"]))
    j = c.patch(f"/api/itineraries/{it['id']}", headers=h, json={"order": new}).json()
    assert j["order"] == new
    j = c.patch(f"/api/itineraries/{it['id']}", headers=h, json={"locked": [new[0]]}).json()
    assert j["order"][0] == new[0] and j["locked"] == [new[0]]
    assert c.patch(f"/api/itineraries/{it['id']}", headers=h, json={"order": ["curug-dago"]}).json()["error"] == "INVALID_ORDER"


def test_rain_risk_with_indoor_alternative(c, monkeypatch):
    monkeypatch.setattr(services, "_http_get", fake_meteo(85))
    h = user(c, "rain@b.co")
    it = c.post("/api/itineraries", headers=h, json={"place_ids": ["curug-dago"], "start_point": START,
                                                      "start_date": next_weekday(1), "days": 1}).json()
    w = it["day_plans"][0]["warnings"][0]
    assert w["code"] == "RAIN_RISK" and w["alternatives"]
    assert all(a["distance_km"] <= 10 for a in w["alternatives"])


def test_weather_and_route_endpoints(c, monkeypatch):
    d = config.today().isoformat()
    assert c.get(f"/api/weather?lat=-6.9&lon=107.6&date={d}").json()["error"] == "UPSTREAM_UNAVAILABLE"
    far = (config.today() + timedelta(days=16)).isoformat()
    r = c.get(f"/api/weather?lat=-6.9&lon=107.6&date={far}")
    assert r.status_code == 422 and r.json()["error"] == "DATE_OUT_OF_RANGE"
    services.reset()
    monkeypatch.setattr(services, "_http_get", lambda u, p=None: {"routes": [{"distance": 8200, "duration": 1260}]})
    j = c.post("/api/route/estimate", json={"from": START, "to": {"lat": -6.92, "lon": 107.63}}).json()
    assert j == {"distance_m": 8200, "duration_s": 1260, "source": "osrm", "distance_km": 8.2, "duration_min": 21}
    assert c.post("/api/route/estimate", json={"from": START, "to": START, "mode": "walking"}).json()["source"] == "estimate"


def test_weather_contract_for_kisah(c, monkeypatch):
    monkeypatch.setattr(services, "_http_get", fake_meteo(80))
    d = (config.today() + timedelta(days=15)).isoformat()
    j = c.get(f"/weather?lat=-6.9211&lon=107.6094&date={d}").json()
    for k in ("date", "precipitation_probability", "fetched_at", "precipitation_mm", "temp_min", "temp_max",
              "weather_code", "source"):
        assert k in j
    assert j["date"] == d and j["precipitation_probability"] == 80 and j["fetched_at"].endswith("+07:00")
    assert c.get(f"/weather?lat=-6.9211&lon=107.6094&date={d}").json()["source"] == "cache"
    a, b = config.today().isoformat(), (config.today() + timedelta(days=2)).isoformat()
    days = c.get(f"/api/weather?lat=-6.9211&lon=107.6094&date={a}&end_date={b}").json()["days"]
    assert [x["date"] for x in days] == [a, (config.today() + timedelta(days=1)).isoformat(), b]
    assert c.get(f"/api/weather?lat=-6.9&lon=107.6&date={b}&end_date={a}").status_code == 422


def test_photo_and_patch_place(c):
    adm = login(c, "admin@jr.test", "adminpass123")
    assert c.get("/api/places/curug-dago").json()["photo"] is None
    body = {"photo": {"url": "https://example.org/curug.jpg", "credit": "Fotografer", "license": "CC BY-SA 4.0"}}
    assert c.patch("/api/places/curug-dago", json=body, headers=user(c, "p@b.co")).status_code == 403
    assert c.patch("/api/places/curug-dago", json={"photo": {"url": "http://x"}}, headers=adm).status_code == 422
    j = c.patch("/api/places/curug-dago", json=body, headers=adm).json()
    assert j["photo"]["url"] == "https://example.org/curug.jpg" and j["photo"]["credit"] == "Fotografer"
    assert c.patch("/api/places/xxx", json=body, headers=adm).status_code == 404


def test_migration_adds_photo_column(tmp_path, monkeypatch):
    import sqlite3
    from app import config, db
    path = tmp_path / "old.db"
    s = sqlite3.connect(path)
    s.execute("CREATE TABLE places(id TEXT PRIMARY KEY, name TEXT NOT NULL, lat REAL NOT NULL, lon REAL NOT NULL,"
              " region_code TEXT NOT NULL, category TEXT NOT NULL, opening_hours TEXT, default_visit_min INTEGER NOT NULL,"
              " outdoor INTEGER NOT NULL, verified INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL)")
    s.commit(); s.close()
    monkeypatch.setattr(config, "DB_PATH", str(path))
    db.init()
    cols = {r[1] for r in sqlite3.connect(path).execute("PRAGMA table_info(places)")}
    assert "photo" in cols