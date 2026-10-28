from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
import hashlib
import os
from pathlib import Path
import secrets
import sqlite3
from typing import Generator

from fastapi import Cookie, FastAPI, HTTPException, Response
from google.auth.exceptions import GoogleAuthError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from pydantic import BaseModel, Field
from fastapi.staticfiles import StaticFiles

app = FastAPI()
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
DATABASE_PATH = Path(os.getenv("DATABASE_PATH", str(Path(__file__).with_name("members.sqlite3"))))
SESSION_COOKIE = "webui_session"
SESSION_LIFETIME = timedelta(days=7)
COOKIE_SECURE = os.getenv("APP_ENV") == "production"


class GoogleCredential(BaseModel):
	credential: str = Field(min_length=1, max_length=8192)


@contextmanager
def database_connection() -> Generator[sqlite3.Connection, None, None]:
	connection = sqlite3.connect(DATABASE_PATH)
	connection.row_factory = sqlite3.Row
	connection.execute("PRAGMA foreign_keys = ON")
	try:
		with connection:
			yield connection
	finally:
		connection.close()


def initialize_database() -> None:
	DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
	with database_connection() as connection:
		connection.executescript(
			"""
			CREATE TABLE IF NOT EXISTS users (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				google_sub TEXT NOT NULL UNIQUE,
				email TEXT NOT NULL,
				name TEXT NOT NULL,
				picture TEXT,
				created_at TEXT NOT NULL
			);

			CREATE TABLE IF NOT EXISTS sessions (
				token_hash TEXT PRIMARY KEY,
				user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				expires_at TEXT NOT NULL
			);
			"""
		)


def session_token_hash(token: str) -> str:
	return hashlib.sha256(token.encode("utf-8")).hexdigest()


def get_session_user(token: str | None) -> dict[str, int | str | None] | None:
	if not token:
		return None

	now = datetime.now(timezone.utc).isoformat()
	with database_connection() as connection:
		row = connection.execute(
			"""
			SELECT users.id, users.email, users.name, users.picture
			FROM sessions
			JOIN users ON users.id = sessions.user_id
			WHERE sessions.token_hash = ? AND sessions.expires_at > ?
			""",
			(session_token_hash(token), now),
		).fetchone()

	if row is None:
		return None
	return dict(row)


initialize_database()


@app.get("/api/config")
def public_config() -> dict[str, str]:
	return {"googleClientId": GOOGLE_CLIENT_ID}


@app.post("/api/auth/google")
def sign_in_with_google(body: GoogleCredential, response: Response) -> dict[str, object]:
	if not GOOGLE_CLIENT_ID:
		raise HTTPException(status_code=503, detail="Google Sign-In is not configured")

	try:
		claims = id_token.verify_oauth2_token(
			body.credential,
			google_requests.Request(),
			GOOGLE_CLIENT_ID,
		)
	except (ValueError, GoogleAuthError) as error:
		raise HTTPException(status_code=401, detail="Invalid Google ID token") from error

	google_sub = claims.get("sub")
	email = claims.get("email")
	if not google_sub or not email or claims.get("email_verified") is not True:
		raise HTTPException(status_code=401, detail="Google account email is not verified")

	now = datetime.now(timezone.utc)
	with database_connection() as connection:
		connection.execute(
			"""
			INSERT INTO users (google_sub, email, name, picture, created_at)
			VALUES (?, ?, ?, ?, ?)
			ON CONFLICT(google_sub) DO UPDATE SET
				email = excluded.email,
				name = excluded.name,
				picture = excluded.picture
			""",
			(
				google_sub,
				email,
				claims.get("name") or email,
				claims.get("picture"),
				now.isoformat(),
			),
		)
		user = connection.execute(
			"SELECT id, email, name, picture FROM users WHERE google_sub = ?",
			(google_sub,),
		).fetchone()

		session_token = secrets.token_urlsafe(32)
		connection.execute(
			"DELETE FROM sessions WHERE expires_at <= ?",
			(now.isoformat(),),
		)
		connection.execute(
			"INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
			(
				session_token_hash(session_token),
				user["id"],
				(now + SESSION_LIFETIME).isoformat(),
			),
		)

	response.set_cookie(
		key=SESSION_COOKIE,
		value=session_token,
		max_age=int(SESSION_LIFETIME.total_seconds()),
		httponly=True,
		secure=COOKIE_SECURE,
		samesite="lax",
		path="/",
	)
	return {"authenticated": True, "user": dict(user)}


@app.get("/api/auth/me")
def current_user(
	webui_session: str | None = Cookie(default=None, alias=SESSION_COOKIE),
) -> dict[str, object]:
	user = get_session_user(webui_session)
	return {"authenticated": user is not None, "user": user}


@app.post("/api/auth/logout")
def sign_out(
	response: Response,
	webui_session: str | None = Cookie(default=None, alias=SESSION_COOKIE),
) -> dict[str, bool]:
	if webui_session:
		with database_connection() as connection:
			connection.execute(
				"DELETE FROM sessions WHERE token_hash = ?",
				(session_token_hash(webui_session),),
			)
	response.delete_cookie(SESSION_COOKIE, path="/", httponly=True, samesite="lax")
	return {"authenticated": False}

# 關鍵：html=True 讓它自動找 index.html
app.mount("/site", StaticFiles(directory="site", html=True), name="site-prefixed")
app.mount("/", StaticFiles(directory="site", html=True), name="site")