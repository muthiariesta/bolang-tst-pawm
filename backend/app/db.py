import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path

from . import config, security

SEED = Path(__file__).parent / "seed" / "places.json"

SCHEMA = """
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, name TEXT,
  password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS places(
  id TEXT PRIMARY KEY, name TEXT NOT NULL, lat REAL NOT NULL, lon REAL NOT NULL,
  region_code TEXT NOT NULL, category TEXT NOT NULL, opening_hours TEXT,
  default_visit_min INTEGER NOT NULL, outdoor INTEGER NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL, photo TEXT);
CREATE TABLE IF NOT EXISTS itineraries(
  id TEXT PRIMARY KEY, owner_id INTEGER NOT NULL REFERENCES users(id), status TEXT NOT NULL,
  params TEXT NOT NULL, order_ids TEXT NOT NULL, locked_ids TEXT NOT NULL, plan TEXT NOT NULL,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS templates(
  id TEXT PRIMARY KEY, source_itinerary_id TEXT UNIQUE, days INTEGER NOT NULL,
  place_ids TEXT NOT NULL, featured INTEGER NOT NULL DEFAULT 0, partner_label TEXT,
  created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS api_keys(
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, prefix TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL, active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL, last_used_at TEXT);
"""


def now() -> str:
    return datetime.now(config.WIB).isoformat(timespec="seconds")


@contextmanager
def conn():
    Path(config.DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    c = sqlite3.connect(config.DB_PATH)
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA foreign_keys=ON")
    try:
        yield c
        c.commit()
    finally:
        c.close()


def init():
    with conn() as c:
        c.executescript(SCHEMA)
        cols = {r[1] for r in c.execute("PRAGMA table_info(places)")}
        if "photo" not in cols:  # migrasi database lama tanpa kolom foto
            c.execute("ALTER TABLE places ADD COLUMN photo TEXT")
        if c.execute("SELECT COUNT(*) FROM places").fetchone()[0] == 0:
            for p in json.loads(SEED.read_text(encoding="utf-8")):
                insert_place(c, p)
        for email, pw, role, name in ((config.ADMIN_EMAIL, config.ADMIN_PASSWORD, "admin", "Admin Jelajah Rute"),
                                      (config.DEMO_EMAIL, config.DEMO_PASSWORD, "user", "Akun Demo")):
            if email and pw and not c.execute("SELECT 1 FROM users WHERE email=?", (email.lower(),)).fetchone():
                c.execute("INSERT INTO users(email,name,password_hash,role,created_at) VALUES(?,?,?,?,?)",
                          (email.lower(), name, security.hash_pw(pw), role, now()))


def insert_place(c, p):
    c.execute(
        "INSERT INTO places(id,name,lat,lon,region_code,category,opening_hours,default_visit_min,outdoor,verified,updated_at,photo)"
        " VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
        (p["id"], p["name"], p["lat"], p["lon"], p["region_code"], p["category"],
         json.dumps(p["opening_hours"]) if p.get("opening_hours") is not None else None,
         p["default_visit_min"], int(p["outdoor"]), int(p.get("verified", False)), now(),
         json.dumps(p["photo"]) if p.get("photo") else None))


def place_dict(r) -> dict:
    d = dict(r)
    d["opening_hours"] = json.loads(d["opening_hours"]) if d["opening_hours"] else None
    d["outdoor"] = bool(d["outdoor"])
    d["verified"] = bool(d["verified"])
    d["photo"] = json.loads(d["photo"]) if d.get("photo") else None
    return d


def all_places(c) -> dict:
    return {r["id"]: place_dict(r) for r in c.execute("SELECT * FROM places")}