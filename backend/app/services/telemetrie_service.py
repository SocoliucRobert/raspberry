"""Logica de procesare a telemetriei: salvare măsurători, verificare praguri,
generare alerte și transmitere în timp real prin WebSocket."""
import logging
from datetime import datetime, timezone, timedelta

from flask import current_app

from ..extensions import db, socketio
from ..models import Device, Telemetry, Alert

logger = logging.getLogger(__name__)

# Unități de măsură implicite în funcție de metrică
UNITATI_IMPLICITE = {
    "temperatura": "°C",
    "umiditate": "%",
    "presiune": "hPa",
    "luminozitate": "lx",
    "co2": "ppm",
    "tensiune": "V",
    "curent": "A",
    "putere": "W",
    "zgomot": "dB",
    "viteza_vant": "km/h",
    "calitate_aer": "AQI",
    "nivel_apa": "%",
}


def _acum():
    return datetime.now(timezone.utc)


def proceseaza_telemetrie(cod_dispozitiv: str, payload: dict, sursa: str = "mqtt"):
    """Procesează un pachet de telemetrie de la un dispozitiv.

    `payload` poate fi de forma:
        {"temperatura": 23.5, "umiditate": 60}
    sau:
        {"temperatura": {"valoare": 23.5, "unitate": "°C"}}
    """
    device = Device.query.filter_by(cod_dispozitiv=cod_dispozitiv).first()
    if not device:
        logger.warning("Telemetrie ignorată: dispozitiv necunoscut '%s'", cod_dispozitiv)
        return None

    acum = _acum()
    era_offline = device.stare != "online"
    device.stare = "online"
    device.ultima_vazut = acum

    praguri = device.praguri or {}
    inregistrari = []
    alerte_noi = []

    for metrica, brut in payload.items():
        if isinstance(brut, dict):
            valoare = brut.get("valoare", brut.get("value"))
            unitate = brut.get("unitate", brut.get("unit")) or UNITATI_IMPLICITE.get(metrica)
        else:
            valoare = brut
            unitate = UNITATI_IMPLICITE.get(metrica)

        if valoare is None:
            continue
        try:
            valoare = float(valoare)
        except (TypeError, ValueError):
            logger.debug("Valoare invalidă pentru %s: %r", metrica, brut)
            continue

        masuratoare = Telemetry(
            dispozitiv_id=device.id,
            metrica=metrica,
            valoare=valoare,
            unitate=unitate,
            inregistrat_la=acum,
        )
        db.session.add(masuratoare)
        inregistrari.append(masuratoare)

        # Verificare praguri configurate pentru această metrică
        prag = praguri.get(metrica) if isinstance(praguri, dict) else None
        if prag:
            mn = prag.get("min")
            mx = prag.get("max")
            mesaj = None
            if mx is not None and valoare > float(mx):
                mesaj = (
                    f"{metrica.capitalize()} = {valoare}{unitate or ''} a depășit "
                    f"pragul maxim ({mx}{unitate or ''})"
                )
            elif mn is not None and valoare < float(mn):
                mesaj = (
                    f"{metrica.capitalize()} = {valoare}{unitate or ''} este sub "
                    f"pragul minim ({mn}{unitate or ''})"
                )
            if mesaj:
                alerta = Alert(
                    dispozitiv_id=device.id,
                    tip="prag_depasit",
                    severitate="critic",
                    mesaj=f"[{device.nume}] {mesaj}",
                    metrica=metrica,
                    valoare=valoare,
                )
                db.session.add(alerta)
                alerte_noi.append(alerta)

    # Alertă informativă când dispozitivul revine online
    if era_offline:
        alerta = Alert(
            dispozitiv_id=device.id,
            tip="dispozitiv_online",
            severitate="info",
            mesaj=f"Dispozitivul „{device.nume}” este din nou online.",
        )
        db.session.add(alerta)
        alerte_noi.append(alerta)

    db.session.commit()
    _emite_actualizari(device, inregistrari, alerte_noi)
    return device


def proceseaza_status(cod_dispozitiv: str, stare_text: str):
    """Procesează un mesaj de stare (online/offline) de la dispozitiv."""
    stare = stare_text.strip().strip('"').lower()
    if stare not in ("online", "offline"):
        # acceptă și JSON de forma {"stare": "online"}
        try:
            import json

            stare = str(json.loads(stare_text).get("stare", "")).lower()
        except Exception:
            return None
    if stare not in ("online", "offline"):
        return None

    device = Device.query.filter_by(cod_dispozitiv=cod_dispozitiv).first()
    if not device:
        return None

    device.stare = stare
    if stare == "online":
        device.ultima_vazut = _acum()
    db.session.commit()

    socketio.emit(
        "dispozitiv_actualizat",
        {"id": device.id, "cod_dispozitiv": device.cod_dispozitiv, "stare": device.stare},
    )
    return device


def verifica_dispozitive_offline(app):
    """Marchează drept offline dispozitivele care nu au mai trimis date.

    Rulează periodic într-un task de fundal.
    """
    with app.app_context():
        timeout = app.config.get("DEVICE_OFFLINE_TIMEOUT", 90)
        limita = _acum() - timedelta(seconds=timeout)
        dispozitive = Device.query.filter(
            Device.stare == "online", Device.ultima_vazut < limita
        ).all()
        if not dispozitive:
            return

        alerte_noi = []
        for device in dispozitive:
            device.stare = "offline"
            alerta = Alert(
                dispozitiv_id=device.id,
                tip="dispozitiv_offline",
                severitate="avertisment",
                mesaj=f"Dispozitivul „{device.nume}” nu mai răspunde (offline).",
            )
            db.session.add(alerta)
            alerte_noi.append((device, alerta))

        # Commit înainte de emitere pentru ca to_dict() să aibă toate câmpurile
        db.session.commit()

        for device, alerta in alerte_noi:
            socketio.emit(
                "dispozitiv_actualizat",
                {"id": device.id, "cod_dispozitiv": device.cod_dispozitiv, "stare": "offline"},
            )
            socketio.emit("alerta", alerta.to_dict())


def _emite_actualizari(device, inregistrari, alerte_noi):
    """Transmite actualizările către clienții conectați prin WebSocket."""
    try:
        socketio.emit(
            "telemetrie",
            {
                "dispozitiv_id": device.id,
                "cod_dispozitiv": device.cod_dispozitiv,
                "stare": device.stare,
                "valori": [t.to_dict() for t in inregistrari],
            },
        )
        socketio.emit(
            "dispozitiv_actualizat",
            {
                "id": device.id,
                "cod_dispozitiv": device.cod_dispozitiv,
                "stare": device.stare,
                "ultima_vazut": device.ultima_vazut.isoformat()
                if device.ultima_vazut
                else None,
            },
        )
        for alerta in alerte_noi:
            socketio.emit("alerta", alerta.to_dict())
    except Exception:
        logger.exception("Eroare la transmiterea actualizărilor WebSocket")
