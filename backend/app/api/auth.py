"""Rutele de autentificare și înregistrare (JWT)."""
import re

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required

from ..extensions import db
from ..models import User
from . import utilizator_curent

auth_bp = Blueprint("auth", __name__)

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


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
