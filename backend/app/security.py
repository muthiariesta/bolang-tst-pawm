import hashlib
import secrets
import time

import bcrypt
import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from . import config
from .errors import AppError


# ---------- password & JWT ----------
def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def check_pw(pw: str, h: str) -> bool:
    return bcrypt.checkpw(pw.encode(), h.encode())


def make_token(uid: int, role: str) -> str:
    t = int(time.time())
    return jwt.encode({"sub": str(uid), "role": role, "iat": t, "exp": t + config.JWT_TTL},
                      config.JWT_SECRET, algorithm="HS256")


bearer = HTTPBearer(auto_error=False, description="JWT dari POST /api/auth/login")


def current_user(cred: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    if cred is None or cred.scheme.lower() != "bearer":
        raise AppError(401, "UNAUTHORIZED", "Token tidak ada. Login dulu lewat /api/auth/login.")
    try:
        claims = jwt.decode(cred.credentials, config.JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise AppError(401, "TOKEN_EXPIRED", "Token sudah kedaluwarsa. Login ulang.")
    except jwt.PyJWTError:
        raise AppError(401, "UNAUTHORIZED", "Token tidak valid.")
    return {"id": int(claims["sub"]), "role": claims.get("role", "user")}


def admin_user(user: dict = Depends(current_user)) -> dict:
    if user["role"] != "admin":
        raise AppError(403, "FORBIDDEN", "Aksi ini khusus admin.")
    return user


def ensure_owner(user: dict, owner_id: int):
    """Otorisasi tingkat data: hanya pemilik yang boleh membaca/mengubah."""
    if user["id"] != owner_id:
        raise AppError(403, "FORBIDDEN", "Itinerary ini milik pengguna lain.")


# ---------- X-API-Key (server ke server) ----------
def new_api_key() -> str:
    return "jr_" + secrets.token_urlsafe(24)


def hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()
