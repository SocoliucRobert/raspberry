"""Rutele de autentificare și înregistrare (JWT)."""
import os
import re
import secrets
import urllib.parse

import requests
from flask import Blueprint, request, jsonify, current_app, redirect
from flask_jwt_extended import create_access_token, jwt_required

from ..extensions import db
from ..models import User
from . import utilizator_curent

auth_bp = Blueprint("auth", __name__)

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


def _google_oauth_enabled():
    return bool(current_app.config.get("GOOGLE_CLIENT_ID"))


def _frontend_url():
    return current_app.config.get("FRONTEND_URL", "http://localhost:5173")


@auth_bp.post("/inregistrare")
def inregistrare():
    date = request.get_json(silent=True) or {}
    nume = (date.get("nume_utilizator") or "").strip()
    email = (date.get("email") or "").strip().lower()
    parola = date.get("parola") or ""

    if not nume or not email or not parola:
        return jsonify({"eroare": "Toate câmpurile sunt obligatorii."}), 400
    if len(nume) < 3:
        return jsonify({"eroare": "Numele de utilizator trebuie să aibă cel puțin 3 caractere."}), 400
    if not EMAIL_REGEX.match(email):
        return jsonify({"eroare": "Adresa de email nu este validă."}), 400
    if len(parola) < 6:
        return jsonify({"eroare": "Parola trebuie să aibă cel puțin 6 caractere."}), 400

    existent = User.query.filter(
        (User.nume_utilizator == nume) | (User.email == email)
    ).first()
    if existent:
        return jsonify({"eroare": "Numele de utilizator sau emailul este deja folosit."}), 409

    # Primul cont creat devine administrator
    rol = "admin" if User.query.count() == 0 else "utilizator"
    utilizator = User(nume_utilizator=nume, email=email, rol=rol)
    utilizator.seteaza_parola(parola)
    db.session.add(utilizator)
    db.session.commit()

    token = create_access_token(identity=str(utilizator.id), additional_claims={"rol": utilizator.rol})
    return jsonify({"token": token, "utilizator": utilizator.to_dict()}), 201


@auth_bp.post("/autentificare")
def autentificare():
    date = request.get_json(silent=True) or {}
    identificator = (date.get("nume_utilizator") or date.get("email") or "").strip()
    parola = date.get("parola") or ""

    if not identificator or not parola:
        return jsonify({"eroare": "Introdu numele de utilizator/emailul și parola."}), 400

    utilizator = User.query.filter(
        (User.nume_utilizator == identificator) | (User.email == identificator.lower())
    ).first()

    if not utilizator or not utilizator.verifica_parola(parola):
        return jsonify({"eroare": "Date de autentificare incorecte."}), 401

    token = create_access_token(identity=str(utilizator.id), additional_claims={"rol": utilizator.rol})
    return jsonify({"token": token, "utilizator": utilizator.to_dict()})


@auth_bp.get("/profil")
@jwt_required()
def profil():
    utilizator = utilizator_curent()
    if not utilizator:
        return jsonify({"eroare": "Utilizator inexistent."}), 404
    return jsonify(utilizator.to_dict())


# ---------------------------------------------------------------------------
# Google OAuth
# ---------------------------------------------------------------------------

@auth_bp.get("/google")
def google_login():
    """Redirectează utilizatorul către pagina de consimțământ Google."""
    if not _google_oauth_enabled():
        return jsonify({"eroare": "Autentificarea Google nu este configurată."}), 503

    client_id = current_app.config["GOOGLE_CLIENT_ID"]
    redirect_uri = request.url_root.rstrip("/") + "/api/auth/google/callback"
    state = secrets.token_urlsafe(32)

    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "online",
        "prompt": "select_account",
    }
    url = f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"
    return redirect(url)


@auth_bp.get("/google/callback")
def google_callback():
    """Primește codul de la Google, obține datele utilizatorului și emite JWT."""
    if not _google_oauth_enabled():
        return jsonify({"eroare": "Autentificarea Google nu este configurată."}), 503

    code = request.args.get("code")
    eroare = request.args.get("error")

    if eroare:
        return redirect(f"{_frontend_url()}/login?error=google_{eroare}")
    if not code:
        return redirect(f"{_frontend_url()}/login?error=google_no_code")

    client_id = current_app.config["GOOGLE_CLIENT_ID"]
    client_secret = current_app.config["GOOGLE_CLIENT_SECRET"]
    redirect_uri = request.url_root.rstrip("/") + "/api/auth/google/callback"

    # Schimbă codul pentru un access token
    token_resp = requests.post(
        GOOGLE_TOKEN_URL,
        data={
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        },
        timeout=15,
    )
    if not token_resp.ok:
        return redirect(f"{_frontend_url()}/login?error=google_token")

    access_token = token_resp.json().get("access_token")
    if not access_token:
        return redirect(f"{_frontend_url()}/login?error=google_token")

    # Obține datele utilizatorului
    user_resp = requests.get(
        GOOGLE_USERINFO_URL,
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=15,
    )
    if not user_resp.ok:
        return redirect(f"{_frontend_url()}/login?error=google_userinfo")

    user_info = user_resp.json()
    google_id = user_info.get("id")
    email = user_info.get("email", "").lower()
    nume = user_info.get("name") or email.split("@")[0]
    avatar = user_info.get("picture")

    if not google_id or not email:
        return redirect(f"{_frontend_url()}/login?error=google_incomplete")

    # Caută sau creează utilizatorul
    utilizator = User.query.filter_by(google_id=google_id).first()
    if not utilizator:
        # Verifică dacă există deja un cont cu același email
        utilizator = User.query.filter_by(email=email).first()
        if utilizator:
            # Leagă contul existent de Google
            utilizator.google_id = google_id
            if avatar:
                utilizator.avatar_url = avatar
            db.session.commit()
        else:
            # Creează utilizator nou
            rol = "admin" if User.query.count() == 0 else "utilizator"
            utilizator = User(
                nume_utilizator=nume,
                email=email,
                google_id=google_id,
                avatar_url=avatar,
                rol=rol,
            )
            db.session.add(utilizator)
            db.session.commit()

    token = create_access_token(
        identity=str(utilizator.id),
        additional_claims={"rol": utilizator.rol},
    )
    return redirect(f"{_frontend_url()}/login?token={token}")
