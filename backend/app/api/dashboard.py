"""Ruta pentru statisticile panoului de control."""
from datetime import datetime, timezone, timedelta

from flask import Blueprint, jsonify
from sqlalchemy import func

from ..extensions import db
from ..models import Device, Telemetry, Alert
from . import utilizator_curent

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.get("/statistici")
def statistici():
    # Importat aici pentru a aplica @jwt_required dinamic
    from flask_jwt_extended import verify_jwt_in_request

    verify_jwt_in_request()
    utilizator = utilizator_curent()

    interogare_dispozitive = Device.query
    if not utilizator.este_admin:
        interogare_dispozitive = interogare_dispozitive.filter_by(proprietar_id=utilizator.id)

    ids_dispozitive = [d.id for d in interogare_dispozitive.with_entities(Device.id).all()]

    total = len(ids_dispozitive)
    online = interogare_dispozitive.filter(Device.stare == "online").count()
    offline = total - online

    acum = datetime.now(timezone.utc)
    ultimele_24h = acum - timedelta(hours=24)

    alerte_necitite = 0
    alerte_critice_24h = 0
    masuratori_24h = 0
    if ids_dispozitive:
        alerte_necitite = (
            Alert.query.filter(
                Alert.dispozitiv_id.in_(ids_dispozitive), Alert.citita.is_(False)
            ).count()
        )
        alerte_critice_24h = (
            Alert.query.filter(
                Alert.dispozitiv_id.in_(ids_dispozitive),
                Alert.severitate == "critic",
                Alert.creat_la >= ultimele_24h,
            ).count()
        )
        masuratori_24h = (
            Telemetry.query.filter(
                Telemetry.dispozitiv_id.in_(ids_dispozitive),
                Telemetry.inregistrat_la >= ultimele_24h,
            ).count()
        )

    # Distribuția dispozitivelor pe tipuri
    distributie_tipuri = []
    if ids_dispozitive:
        randuri = (
            db.session.query(Device.tip, func.count(Device.id))
            .filter(Device.id.in_(ids_dispozitive))
            .group_by(Device.tip)
            .all()
        )
        distributie_tipuri = [{"tip": t, "numar": n} for t, n in randuri]

    # Ultimele 5 alerte
    alerte_recente = []
    if ids_dispozitive:
        alerte_recente = [
            a.to_dict()
            for a in Alert.query.filter(Alert.dispozitiv_id.in_(ids_dispozitive))
            .order_by(Alert.creat_la.desc())
            .limit(5)
            .all()
        ]

    return jsonify(
        {
            "total_dispozitive": total,
            "dispozitive_online": online,
            "dispozitive_offline": offline,
            "alerte_necitite": alerte_necitite,
            "alerte_critice_24h": alerte_critice_24h,
            "masuratori_24h": masuratori_24h,
            "distributie_tipuri": distributie_tipuri,
            "alerte_recente": alerte_recente,
        }
    )
