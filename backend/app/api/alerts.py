"""Rutele pentru gestionarea alertelor."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from ..extensions import db
from ..models import Alert, Device
from . import utilizator_curent

alerts_bp = Blueprint("alerts", __name__)


def _interogare_alerte_utilizator():
    """Alertele vizibile pentru utilizatorul curent (doar dispozitivele proprii)."""
    utilizator = utilizator_curent()
    interogare = Alert.query.join(Device, Alert.dispozitiv_id == Device.id)
    if not utilizator.este_admin:
        interogare = interogare.filter(Device.proprietar_id == utilizator.id)
    return interogare


@alerts_bp.get("")
@jwt_required()
def lista_alerte():
    interogare = _interogare_alerte_utilizator()

    doar_necitite = request.args.get("necitite", "false").lower() == "true"
    severitate = request.args.get("severitate")
    try:
        limita = min(int(request.args.get("limita", 100)), 500)
    except ValueError:
        limita = 100

    if doar_necitite:
        interogare = interogare.filter(Alert.citita.is_(False))
    if severitate:
        interogare = interogare.filter(Alert.severitate == severitate)

    alerte = interogare.order_by(Alert.creat_la.desc()).limit(limita).all()
    return jsonify([a.to_dict() for a in alerte])


@alerts_bp.get("/necitite")
@jwt_required()
def numar_necitite():
    numar = _interogare_alerte_utilizator().filter(Alert.citita.is_(False)).count()
    return jsonify({"numar": numar})


@alerts_bp.put("/<int:alert_id>/citeste")
@jwt_required()
def marcheaza_citita(alert_id):
    alerta = _interogare_alerte_utilizator().filter(Alert.id == alert_id).first()
    if not alerta:
        return jsonify({"eroare": "Alerta nu există."}), 404
    alerta.citita = True
    db.session.commit()
    return jsonify(alerta.to_dict())


@alerts_bp.put("/citeste-toate")
@jwt_required()
def marcheaza_toate_citite():
    alerte = _interogare_alerte_utilizator().filter(Alert.citita.is_(False)).all()
    for alerta in alerte:
        alerta.citita = True
    db.session.commit()
    return jsonify({"mesaj": f"{len(alerte)} alerte au fost marcate ca citite."})


@alerts_bp.delete("/<int:alert_id>")
@jwt_required()
def sterge_alerta(alert_id):
    alerta = _interogare_alerte_utilizator().filter(Alert.id == alert_id).first()
    if not alerta:
        return jsonify({"eroare": "Alerta nu există."}), 404
    db.session.delete(alerta)
    db.session.commit()
    return jsonify({"mesaj": "Alerta a fost ștearsă."})
