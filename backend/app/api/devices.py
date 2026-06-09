"""Rutele pentru gestionarea dispozitivelor IoT."""
from datetime import datetime, timezone, timedelta

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import distinct

from ..extensions import db
from ..models import Device, Telemetry, Alert
from ..mqtt import publica_comanda
from . import utilizator_curent

devices_bp = Blueprint("devices", __name__)


def _dispozitiv_permis(device_id):
    """Returnează (dispozitiv, eroare_response). Verifică dreptul de acces."""
    utilizator = utilizator_curent()
    device = Device.query.get(device_id)
    if not device:
        return None, (jsonify({"eroare": "Dispozitivul nu există."}), 404)
    if not utilizator.este_admin and device.proprietar_id != utilizator.id:
        return None, (jsonify({"eroare": "Acces interzis la acest dispozitiv."}), 403)
    return device, None


@devices_bp.get("")
@jwt_required()
def lista_dispozitive():
    utilizator = utilizator_curent()
    interogare = Device.query
    if not utilizator.este_admin:
        interogare = interogare.filter_by(proprietar_id=utilizator.id)
    dispozitive = interogare.order_by(Device.creat_la.desc()).all()
    return jsonify([d.to_dict(include_ultima_telemetrie=True) for d in dispozitive])


@devices_bp.post("")
@jwt_required()
def creeaza_dispozitiv():
    utilizator = utilizator_curent()
    date = request.get_json(silent=True) or {}
    cod = (date.get("cod_dispozitiv") or "").strip()
    nume = (date.get("nume") or "").strip()

    if not cod or not nume:
        return jsonify({"eroare": "Codul dispozitivului și numele sunt obligatorii."}), 400
    if Device.query.filter_by(cod_dispozitiv=cod).first():
        return jsonify({"eroare": "Există deja un dispozitiv cu acest cod."}), 409

    device = Device(
        cod_dispozitiv=cod,
        nume=nume,
        tip=(date.get("tip") or "senzor").strip(),
        locatie=(date.get("locatie") or "").strip() or None,
        descriere=(date.get("descriere") or "").strip() or None,
        praguri=date.get("praguri") or {},
        proprietar_id=utilizator.id,
    )
    db.session.add(device)
    db.session.commit()
    return jsonify(device.to_dict(include_ultima_telemetrie=True)), 201


@devices_bp.get("/<int:device_id>")
@jwt_required()
def detalii_dispozitiv(device_id):
    device, eroare = _dispozitiv_permis(device_id)
    if eroare:
        return eroare
    date = device.to_dict(include_ultima_telemetrie=True)
    # Lista metricilor disponibile pentru acest dispozitiv
    metrici = (
        db.session.query(distinct(Telemetry.metrica))
        .filter(Telemetry.dispozitiv_id == device.id)
        .all()
    )
    date["metrici"] = sorted(m[0] for m in metrici)
    return jsonify(date)


@devices_bp.put("/<int:device_id>")
@jwt_required()
def actualizeaza_dispozitiv(device_id):
    device, eroare = _dispozitiv_permis(device_id)
    if eroare:
        return eroare
    date = request.get_json(silent=True) or {}

    if "nume" in date:
        nume = (date.get("nume") or "").strip()
        if not nume:
            return jsonify({"eroare": "Numele nu poate fi gol."}), 400
        device.nume = nume
    if "tip" in date:
        device.tip = (date.get("tip") or "senzor").strip()
    if "locatie" in date:
        device.locatie = (date.get("locatie") or "").strip() or None
    if "descriere" in date:
        device.descriere = (date.get("descriere") or "").strip() or None
    if "praguri" in date and isinstance(date["praguri"], dict):
        device.praguri = date["praguri"]

    db.session.commit()
    return jsonify(device.to_dict(include_ultima_telemetrie=True))


@devices_bp.delete("/<int:device_id>")
@jwt_required()
def sterge_dispozitiv(device_id):
    device, eroare = _dispozitiv_permis(device_id)
    if eroare:
        return eroare
    db.session.delete(device)
    db.session.commit()
    return jsonify({"mesaj": "Dispozitivul a fost șters."})


@devices_bp.get("/<int:device_id>/telemetrie")
@jwt_required()
def istoric_telemetrie(device_id):
    device, eroare = _dispozitiv_permis(device_id)
    if eroare:
        return eroare

    metrica = request.args.get("metrica")
    try:
        ore = int(request.args.get("ore", 24))
    except ValueError:
        ore = 24
    try:
        limita = min(int(request.args.get("limita", 1000)), 5000)
    except ValueError:
        limita = 1000

    de_la = datetime.now(timezone.utc) - timedelta(hours=ore)
    interogare = Telemetry.query.filter(
        Telemetry.dispozitiv_id == device.id,
        Telemetry.inregistrat_la >= de_la,
    )
    if metrica:
        interogare = interogare.filter(Telemetry.metrica == metrica)

    masuratori = (
        interogare.order_by(Telemetry.inregistrat_la.asc()).limit(limita).all()
    )
    return jsonify([m.to_dict() for m in masuratori])


@devices_bp.post("/<int:device_id>/comanda")
@jwt_required()
def trimite_comanda(device_id):
    device, eroare = _dispozitiv_permis(device_id)
    if eroare:
        return eroare
    comanda = request.get_json(silent=True) or {}
    if not comanda:
        return jsonify({"eroare": "Comanda nu poate fi goală."}), 400
    trimis = publica_comanda(device.cod_dispozitiv, comanda)
    if not trimis:
        return jsonify({"eroare": "Brokerul MQTT este indisponibil."}), 503
    return jsonify({"mesaj": "Comanda a fost trimisă.", "comanda": comanda})
