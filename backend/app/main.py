import json
import logging
import sqlite3
import time
import uuid
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from datetime import date as Date, timedelta
from typing import Dict, List, Literal, Optional

from fastapi import APIRouter, Depends, FastAPI, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel, Field, field_validator
from starlette.exceptions import HTTPException as StarletteHTTPException

from . import config, db, planner, security, services
from .errors import AppError

log = logging.getLogger("bolang")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


@asynccontextmanager
async def lifespan(_):
    db.init()
    yield


DESC = """Penyusun itinerary wisata N hari di Bandung Raya, dengan Katalog Tempat sendiri.

**Akses**
- Baca publik (katalog, cuaca, rute, template): tanpa auth, 60 permintaan/menit per IP.
- Aksi pengguna (itinerary): `Authorization: Bearer <JWT>` dari `POST /api/auth/login`.
- Admin (tambah tempat, kelola API key): JWT akun berperan `admin`.
- Server ke server: header `X-API-Key: jr_...`, kuota 60/menit per key. Minta key ke tim Jelajah Rute.

Galat: `{"error":"KODE","message":"..."}`. Daftar: `{"data":[...],"page":1,"total":N}`."""

app = FastAPI(title="Bolang API · Jelajah Rute", version=config.VERSION, description=DESC, lifespan=lifespan,
              docs_url=None, redoc_url=None, openapi_url="/api/openapi.json")
_hits: dict = defaultdict(deque)


def err(status, code, msg):
    return JSONResponse(status_code=status, content={"error": code, "message": msg})


@app.exception_handler(AppError)
async def _app_err(_, e: AppError):
    return err(e.status, e.code, e.message)


@app.exception_handler(RequestValidationError)
async def _val_err(_, e: RequestValidationError):
    f = e.errors()[0]
    where = ".".join(str(x) for x in f["loc"] if x not in ("body", "query", "path"))
    return err(422, "VALIDATION_ERROR", f"{where}: {f['msg']}" if where else f["msg"])


@app.exception_handler(StarletteHTTPException)
async def _http_err(_, e: StarletteHTTPException):
    codes = {404: "NOT_FOUND", 405: "METHOD_NOT_ALLOWED"}
    return err(e.status_code, codes.get(e.status_code, "ERROR"), str(e.detail))


@app.middleware("http")
async def api_key_and_rate_limit(request: Request, call_next):
    path = request.url.path
    if path.endswith("/health") or path.endswith("/docs") or path.endswith("openapi.json"):
        return await call_next(request)
    key = request.headers.get("x-api-key")
    if key:
        with db.conn() as c:
            row = c.execute("SELECT id,name FROM api_keys WHERE key_hash=? AND active=1",
                            (security.hash_key(key),)).fetchone()
            if not row:
                return err(401, "INVALID_API_KEY", "X-API-Key tidak dikenal atau sudah dicabut.")
            c.execute("UPDATE api_keys SET last_used_at=? WHERE id=?", (db.now(), row["id"]))
        bucket = f"key:{row['id']}"
        log.info("api_client=%s %s %s", row["name"], request.method, path)
    else:
        ip = request.headers.get("x-real-ip") or (request.client.host if request.client else "?")
        bucket = f"ip:{ip}"
    now, q = time.time(), _hits[bucket]
    while q and now - q[0] > 60:
        q.popleft()
    if len(q) >= config.RATE_LIMIT:
        return err(429, "RATE_LIMITED", f"Terlalu banyak permintaan. Maksimal {config.RATE_LIMIT} per menit.")
    q.append(now)
    return await call_next(request)


r = APIRouter()


# ================= system =================
@r.get("/health", tags=["system"])
def health():
    return {"status": "ok", "service": "bolang", "version": config.VERSION}


# ================= auth =================
class Register(BaseModel):
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", examples=["kamu@contoh.id"])
    password: str = Field(min_length=8, max_length=72, examples=["rahasia123"])
    name: Optional[str] = Field(default=None, max_length=80)


class Login(BaseModel):
    email: str = Field(examples=["kamu@contoh.id"])
    password: str = Field(examples=["rahasia123"])


def user_out(u):
    return {"id": u["id"], "email": u["email"], "name": u["name"], "role": u["role"]}


@r.post("/auth/register", status_code=201, tags=["auth"], summary="Daftar akun (peran user)")
def register(b: Register):
    with db.conn() as c:
        try:
            cur = c.execute("INSERT INTO users(email,name,password_hash,role,created_at) VALUES(?,?,?,?,?)",
                            (b.email.lower(), b.name, security.hash_pw(b.password), "user", db.now()))
        except sqlite3.IntegrityError:
            raise AppError(400, "EMAIL_TAKEN", "Email sudah terdaftar.")
        return user_out(c.execute("SELECT * FROM users WHERE id=?", (cur.lastrowid,)).fetchone())


@r.post("/auth/login", tags=["auth"], summary="Masuk, menghasilkan JWT (berlaku 1 jam)")
def login(b: Login):
    with db.conn() as c:
        u = c.execute("SELECT * FROM users WHERE email=?", (b.email.lower(),)).fetchone()
    if not u or not security.check_pw(b.password, u["password_hash"]):
        raise AppError(401, "INVALID_CREDENTIALS", "Email atau password salah.")
    return {"token": security.make_token(u["id"], u["role"]), "token_type": "Bearer",
            "expires_in": config.JWT_TTL, "user": user_out(u)}


@r.get("/auth/me", tags=["auth"], summary="Profil pemilik token")
def me(user=Depends(security.current_user)):
    with db.conn() as c:
        u = c.execute("SELECT * FROM users WHERE id=?", (user["id"],)).fetchone()
    if not u:
        raise AppError(401, "UNAUTHORIZED", "Akun tidak ditemukan.")
    return user_out(u)


# ================= places =================
HOURS = r"^([01]\d|2[0-3]):[0-5]\d$"


class Photo(BaseModel):
    url: str = Field(pattern=r"^https://", examples=["https://upload.wikimedia.org/wikipedia/commons/x/xx/Contoh.jpg"])
    credit: Optional[str] = Field(default=None, max_length=200, examples=["Nama fotografer"])
    license: Optional[str] = Field(default=None, max_length=80, examples=["CC BY-SA 4.0"])
    source: Optional[str] = Field(default=None, max_length=300, description="Halaman asal foto")


def _check_hours(v):
    if v is None:
        return v
    if len(v) != 7:
        raise ValueError("opening_hours wajib berisi ketujuh hari (mon sampai sun)")
    import re
    for day, rng in v.items():
        if rng is None:
            continue
        if len(rng) != 2 or not all(re.match(HOURS, x) for x in rng) or rng[0] >= rng[1]:
            raise ValueError(f"jam {day} harus [HH:MM, HH:MM] dengan jam buka < jam tutup")
    return v


class PlaceIn(BaseModel):
    id: str = Field(pattern=r"^[a-z0-9-]{3,60}$", examples=["kawah-putih"])
    name: str = Field(min_length=2, max_length=120)
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    region_code: str = Field(pattern=r"^\d{2}\.\d{2}\.\d{2}$", description="Kode kecamatan Kemendagri",
                             examples=["32.04.21"])
    category: str = Field(pattern=r"^[a-z0-9-]{3,40}$", examples=["kawah"])
    opening_hours: Dict[Literal["mon", "tue", "wed", "thu", "fri", "sat", "sun"], Optional[List[str]]] = Field(
        description="Per hari [buka, tutup] format HH:MM, null = tutup",
        examples=[{"mon": ["08:00", "17:00"], "tue": ["08:00", "17:00"], "wed": ["08:00", "17:00"],
                   "thu": ["08:00", "17:00"], "fri": None, "sat": ["07:00", "17:00"], "sun": ["07:00", "17:00"]}])
    default_visit_min: int = Field(ge=5, le=720)
    outdoor: bool

    photo: Optional[Photo] = None

    @field_validator("opening_hours")
    @classmethod
    def _hours(cls, v):
        return _check_hours(v)


class PlacePatch(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    lat: Optional[float] = Field(default=None, ge=-90, le=90)
    lon: Optional[float] = Field(default=None, ge=-180, le=180)
    region_code: Optional[str] = Field(default=None, pattern=r"^\d{2}\.\d{2}\.\d{2}$")
    category: Optional[str] = Field(default=None, pattern=r"^[a-z0-9-]{3,40}$")
    opening_hours: Optional[Dict[Literal["mon", "tue", "wed", "thu", "fri", "sat", "sun"], Optional[List[str]]]] = None
    default_visit_min: Optional[int] = Field(default=None, ge=5, le=720)
    outdoor: Optional[bool] = None
    photo: Optional[Photo] = None

    @field_validator("opening_hours")
    @classmethod
    def _hours(cls, v):
        return _check_hours(v)


@r.get("/places", tags=["places"], summary="Daftar tempat di Katalog Tempat")
def list_places(category: Optional[str] = None, region_code: Optional[str] = None,
                outdoor: Optional[bool] = None, page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100)):
    where, args = [], []
    if category:
        where.append("category=?"); args.append(category)
    if region_code:
        where.append("region_code LIKE ?"); args.append(region_code + "%")
    if outdoor is not None:
        where.append("outdoor=?"); args.append(int(outdoor))
    w = (" WHERE " + " AND ".join(where)) if where else ""
    with db.conn() as c:
        total = c.execute(f"SELECT COUNT(*) FROM places{w}", args).fetchone()[0]
        rows = c.execute(f"SELECT * FROM places{w} ORDER BY name LIMIT ? OFFSET ?",
                         args + [limit, (page - 1) * limit]).fetchall()
    return {"data": [db.place_dict(x) for x in rows], "page": page, "total": total}


@r.get("/places/{place_id}", tags=["places"], summary="Detail tempat")
def get_place(place_id: str):
    with db.conn() as c:
        row = c.execute("SELECT * FROM places WHERE id=?", (place_id,)).fetchone()
    if not row:
        raise AppError(404, "NOT_FOUND", "Tempat tidak ditemukan.")
    return db.place_dict(row)


@r.post("/places", status_code=201, tags=["places"], summary="Tambah tempat (JWT admin)")
def add_place(p: PlaceIn, _=Depends(security.admin_user)):
    with db.conn() as c:
        try:
            db.insert_place(c, {**p.model_dump(), "verified": True})
        except sqlite3.IntegrityError:
            raise AppError(400, "PLACE_EXISTS", "ID tempat sudah dipakai.")
        return db.place_dict(c.execute("SELECT * FROM places WHERE id=?", (p.id,)).fetchone())


@r.patch("/places/{place_id}", tags=["places"], summary="Ubah data tempat, termasuk foto (JWT admin)")
def patch_place(place_id: str, p: PlacePatch, _=Depends(security.admin_user)):
    fields = p.model_dump(exclude_unset=True)
    if not fields:
        raise AppError(422, "VALIDATION_ERROR", "Tidak ada field yang diubah.")
    with db.conn() as c:
        if not c.execute("SELECT 1 FROM places WHERE id=?", (place_id,)).fetchone():
            raise AppError(404, "NOT_FOUND", "Tempat tidak ditemukan.")
        for k, v in fields.items():
            if k in ("opening_hours", "photo"):
                v = json.dumps(v) if v is not None else None
            elif k == "outdoor":
                v = int(v)
            c.execute(f"UPDATE places SET {k}=? WHERE id=?", (v, place_id))
        c.execute("UPDATE places SET updated_at=? WHERE id=?", (db.now(), place_id))
        return db.place_dict(c.execute("SELECT * FROM places WHERE id=?", (place_id,)).fetchone())


# ================= route & weather =================
class Point(BaseModel):
    lat: float = Field(ge=-90, le=90, examples=[-6.8655593])
    lon: float = Field(ge=-180, le=180, examples=[107.6156121])


class RouteIn(BaseModel):
    from_: Point = Field(alias="from")
    to: Point
    mode: Literal["driving", "walking"] = "driving"


FORECAST_DAYS = 16  # hari ini + 15 hari, batas prakiraan Open-Meteo


def weather_window(d: Date):
    t = config.today()
    return t <= d <= t + timedelta(days=FORECAST_DAYS - 1)


@r.get("/weather", tags=["route & weather"],
       summary="Prakiraan cuaca harian (Open-Meteo, cache 30 menit)",
       description="Satu tanggal mengembalikan satu objek. Dengan `end_date`, hasilnya `{\"days\": [...]}`. "
                   "Tanggal valid: hari ini sampai 15 hari ke depan (WIB). Di luar itu: 422 DATE_OUT_OF_RANGE.")
def get_weather(lat: float = Query(ge=-90, le=90, examples=[-6.9211]),
                lon: float = Query(ge=-180, le=180, examples=[107.6094]),
                date: Date = Query(..., description="YYYY-MM-DD, WIB"),
                end_date: Optional[Date] = Query(None, description="Opsional, untuk rentang beberapa hari")):
    last = end_date or date
    if last < date:
        raise AppError(422, "VALIDATION_ERROR", "end_date tidak boleh sebelum date.")
    if not (weather_window(date) and weather_window(last)):
        raise AppError(422, "DATE_OUT_OF_RANGE",
                       f"Prakiraan hanya tersedia dari hari ini sampai {FORECAST_DAYS - 1} hari ke depan.")
    days = services.weather_range(lat, lon, date.isoformat(), last.isoformat())
    return {"days": days} if end_date else days[0]


@r.post("/route/estimate", tags=["route & weather"], summary="Estimasi jarak & waktu tempuh (OSRM, fallback garis lurus)")
def route_estimate(b: RouteIn):
    leg = services.route(b.from_.lat, b.from_.lon, b.to.lat, b.to.lon, b.mode)
    return {**leg, "distance_km": round(leg["distance_m"] / 1000, 1), "duration_min": round(leg["duration_s"] / 60)}


# ================= itineraries =================
class ItineraryIn(BaseModel):
    place_ids: List[str] = Field(min_length=1, max_length=30, examples=[["curug-dago", "museum-geologi", "trans-studio-bandung"]])
    start_point: Point
    start_date: Date
    days: int = Field(default=1, ge=1, le=7)
    travel_mode: Literal["driving", "walking"] = "driving"
    day_start: str = Field(default="08:00", pattern=HOURS)
    max_hours: int = Field(default=10, ge=1, le=12)
    visit_min: Dict[str, int] = Field(default_factory=dict, description="Ubah lama kunjungan per place_id (menit)")


class ItineraryPatch(BaseModel):
    order: Optional[List[str]] = Field(default=None, description="Urutan baru place_ids (semua tempat)")
    locked: Optional[List[str]] = Field(default=None, description="place_ids yang dikunci posisinya")
    visit_min: Optional[Dict[str, int]] = None
    status: Optional[Literal["draft", "selesai"]] = None


def _weather_or_none(lat, lon, d):
    if not weather_window(Date.fromisoformat(d)):
        return None
    try:
        return services.weather(lat, lon, d)
    except AppError:
        return None


def _compute(params: dict, seq_ids: list, locked: list, catalog: dict, use_nn: bool):
    places = [catalog[i] for i in seq_ids]
    start = params["start_point"]
    if use_nn:
        locked_pos = {pid: seq_ids.index(pid) for pid in locked}
        places = planner.order(places, start, locked_pos)
    day_plans, unscheduled = planner.schedule(
        places, start=start, start_date=Date.fromisoformat(params["start_date"]), days=params["days"],
        mode=params["travel_mode"], day_start=params["day_start"], max_hours=params["max_hours"],
        visit_min=params["visit_min"], locked=set(locked), catalog=catalog,
        route_fn=services.route, weather_fn=_weather_or_none, captured_at=db.now())
    return [p["id"] for p in places], {"day_plans": day_plans, "unscheduled": unscheduled}


def _out(row, catalog):
    plan = json.loads(row["plan"])
    return {"id": row["id"], "owner_id": row["owner_id"], "status": row["status"], **json.loads(row["params"]),
            "order": json.loads(row["order_ids"]), "locked": json.loads(row["locked_ids"]),
            "needs_refresh": planner.needs_refresh(plan, catalog), **plan,
            "created_at": row["created_at"], "updated_at": row["updated_at"]}


def _load_owned(c, iid, user):
    row = c.execute("SELECT * FROM itineraries WHERE id=?", (iid,)).fetchone()
    if not row:
        raise AppError(404, "NOT_FOUND", "Itinerary tidak ditemukan.")
    security.ensure_owner(user, row["owner_id"])
    return row


@r.post("/itineraries", status_code=201, tags=["itineraries"], summary="Buat itinerary N hari (JWT)")
def create_itinerary(b: ItineraryIn, user=Depends(security.current_user)):
    if len(set(b.place_ids)) != len(b.place_ids):
        raise AppError(422, "VALIDATION_ERROR", "place_ids tidak boleh berulang.")
    if b.start_date < config.today():
        raise AppError(422, "DATE_OUT_OF_RANGE", "Tanggal mulai tidak boleh di masa lalu.")
    with db.conn() as c:
        catalog = db.all_places(c)
        missing = [i for i in b.place_ids if i not in catalog]
        if missing:
            raise AppError(404, "PLACE_NOT_FOUND", f"Tempat tidak ada di katalog: {', '.join(missing)}")
        params = {"start_point": b.start_point.model_dump(), "start_date": b.start_date.isoformat(), "days": b.days,
                  "travel_mode": b.travel_mode, "day_start": b.day_start, "max_hours": b.max_hours,
                  "visit_min": b.visit_min}
        order, plan = _compute(params, b.place_ids, [], catalog, use_nn=True)
        iid, ts = uuid.uuid4().hex[:12], db.now()
        c.execute("INSERT INTO itineraries VALUES(?,?,?,?,?,?,?,?,?)",
                  (iid, user["id"], "draft", json.dumps(params), json.dumps(order), "[]", json.dumps(plan), ts, ts))
        return _out(c.execute("SELECT * FROM itineraries WHERE id=?", (iid,)).fetchone(), catalog)


@r.get("/itineraries", tags=["itineraries"], summary="Daftar itinerary milik sendiri (JWT)")
def my_itineraries(page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100), user=Depends(security.current_user)):
    with db.conn() as c:
        total = c.execute("SELECT COUNT(*) FROM itineraries WHERE owner_id=?", (user["id"],)).fetchone()[0]
        rows = c.execute("SELECT id,status,params,created_at FROM itineraries WHERE owner_id=? "
                         "ORDER BY created_at DESC LIMIT ? OFFSET ?", (user["id"], limit, (page - 1) * limit)).fetchall()
    data = [{"id": x["id"], "status": x["status"], "start_date": json.loads(x["params"])["start_date"],
             "days": json.loads(x["params"])["days"], "created_at": x["created_at"]} for x in rows]
    return {"data": data, "page": page, "total": total}


@r.get("/itineraries/{iid}", tags=["itineraries"], summary="Detail itinerary (JWT pemilik)")
def get_itinerary(iid: str, user=Depends(security.current_user)):
    with db.conn() as c:
        row = _load_owned(c, iid, user)
        return _out(row, db.all_places(c))


@r.patch("/itineraries/{iid}", tags=["itineraries"], summary="Ubah urutan, kunci stop, atau status (JWT pemilik)")
def patch_itinerary(iid: str, b: ItineraryPatch, user=Depends(security.current_user)):
    with db.conn() as c:
        row = _load_owned(c, iid, user)
        catalog = db.all_places(c)
        params = json.loads(row["params"])
        order, locked, plan = json.loads(row["order_ids"]), json.loads(row["locked_ids"]), json.loads(row["plan"])
        recompute = False
        if b.order is not None:
            if sorted(b.order) != sorted(order):
                raise AppError(422, "INVALID_ORDER", "order harus berisi semua place_ids itinerary ini, masing-masing sekali.")
            order, recompute = b.order, True
        if b.locked is not None:
            bad = [x for x in b.locked if x not in order]
            if bad:
                raise AppError(422, "VALIDATION_ERROR", f"locked berisi tempat di luar itinerary: {', '.join(bad)}")
            locked, recompute = b.locked, True
        if b.visit_min is not None:
            params["visit_min"] = {**params["visit_min"], **b.visit_min}
            recompute = True
        if recompute:
            # urutan manual dihormati apa adanya; tanpa order baru, stop tak terkunci diurutkan ulang
            order, plan = _compute(params, order, locked, catalog, use_nn=b.order is None)
        status = b.status or row["status"]
        c.execute("UPDATE itineraries SET status=?,params=?,order_ids=?,locked_ids=?,plan=?,updated_at=? WHERE id=?",
                  (status, json.dumps(params), json.dumps(order), json.dumps(locked), json.dumps(plan), db.now(), iid))
        return _out(c.execute("SELECT * FROM itineraries WHERE id=?", (iid,)).fetchone(), catalog)


@r.post("/itineraries/{iid}/share", status_code=201, tags=["templates"],
        summary="Bagikan itinerary berstatus selesai sebagai template (JWT pemilik)")
def share_itinerary(iid: str, user=Depends(security.current_user)):
    with db.conn() as c:
        row = _load_owned(c, iid, user)
        if row["status"] != "selesai":
            raise AppError(400, "NOT_FINISHED", "Hanya itinerary berstatus selesai yang bisa dibagikan.")
        existing = c.execute("SELECT * FROM templates WHERE source_itinerary_id=?", (iid,)).fetchone()
        if not existing:
            plan = json.loads(row["plan"])
            ids = [s["place_snapshot"]["id"] for d in plan["day_plans"] for s in d["stops"]]
            c.execute("INSERT INTO templates VALUES(?,?,?,?,?,?,?)",
                      (uuid.uuid4().hex[:12], iid, json.loads(row["params"])["days"], json.dumps(ids), 0, None, db.now()))
            existing = c.execute("SELECT * FROM templates WHERE source_itinerary_id=?", (iid,)).fetchone()
        return _template_out(existing, db.all_places(c))


# ================= templates =================
def _template_out(t, catalog):
    ids = json.loads(t["place_ids"])
    return {"id": t["id"], "source_itinerary_id": t["source_itinerary_id"], "days": t["days"], "place_ids": ids,
            "places": [{"id": i, "name": catalog[i]["name"] if i in catalog else None} for i in ids],
            "featured": bool(t["featured"]), "partner_label": t["partner_label"], "created_at": t["created_at"]}


@r.get("/templates", tags=["templates"], summary="Template publik (tanpa data pribadi)")
def list_templates(place_id: Optional[str] = None, days: Optional[int] = Query(None, ge=1, le=7),
                   page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100)):
    with db.conn() as c:
        catalog = db.all_places(c)
        rows = c.execute("SELECT * FROM templates ORDER BY created_at DESC").fetchall()
    items = [t for t in rows
             if (place_id is None or place_id in json.loads(t["place_ids"])) and (days is None or t["days"] == days)]
    return {"data": [_template_out(t, catalog) for t in items[(page - 1) * limit: page * limit]],
            "page": page, "total": len(items)}


# ================= admin: API key =================
class KeyIn(BaseModel):
    name: str = Field(pattern=r"^[a-z0-9-]{2,40}$", examples=["kisah-kalender-budaya"])


@r.post("/admin/api-keys", status_code=201, tags=["admin"], summary="Buat X-API-Key untuk layanan lain (JWT admin)")
def create_key(b: KeyIn, _=Depends(security.admin_user)):
    key = security.new_api_key()
    with db.conn() as c:
        cur = c.execute("INSERT INTO api_keys(name,prefix,key_hash,created_at) VALUES(?,?,?,?)",
                        (b.name, key[:7], security.hash_key(key), db.now()))
    return {"id": cur.lastrowid, "name": b.name, "api_key": key,
            "note": "Simpan sekarang. Key hanya ditampilkan sekali dan disimpan sebagai hash."}


@r.get("/admin/api-keys", tags=["admin"], summary="Daftar API key (tanpa nilai key)")
def list_keys(_=Depends(security.admin_user)):
    with db.conn() as c:
        rows = c.execute("SELECT id,name,prefix,active,created_at,last_used_at FROM api_keys ORDER BY id").fetchall()
    return {"data": [{**dict(x), "active": bool(x["active"])} for x in rows], "page": 1, "total": len(rows)}


@r.delete("/admin/api-keys/{key_id}", tags=["admin"], summary="Cabut API key")
def revoke_key(key_id: int, _=Depends(security.admin_user)):
    with db.conn() as c:
        if c.execute("UPDATE api_keys SET active=0 WHERE id=?", (key_id,)).rowcount == 0:
            raise AppError(404, "NOT_FOUND", "API key tidak ditemukan.")
    return {"id": key_id, "active": False}


app.include_router(r, prefix="/api")
app.include_router(r, include_in_schema=False)  # path tanpa /api tetap jalan


@app.get("/api/docs", include_in_schema=False)
def docs():
    return get_swagger_ui_html(openapi_url="/api/openapi.json", title="Bolang API · Jelajah Rute")


@app.get("/docs", include_in_schema=False)
def docs_redirect():
    return RedirectResponse("/api/docs")