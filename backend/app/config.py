import os
from datetime import date, datetime, timedelta, timezone

WIB = timezone(timedelta(hours=7))

DB_PATH = os.getenv("DB_PATH", "data/bolang.db")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-only-secret-ganti-di-env-0123456789abcdef")
JWT_TTL = int(os.getenv("JWT_TTL", "3600"))
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")
DEMO_EMAIL = os.getenv("DEMO_EMAIL", "")
DEMO_PASSWORD = os.getenv("DEMO_PASSWORD", "")
RATE_LIMIT = int(os.getenv("RATE_LIMIT", "60"))  # per menit, per IP atau per API key
VERSION = "1.1.0"


def today() -> date:
    return datetime.now(WIB).date()
