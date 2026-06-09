"""Populează baza de date cu date demonstrative.

Rulează:  python seed.py
Creează conturi demo, dispozitive și istoric de telemetrie pentru testare.
"""
import os
import sys
import math
import random
from datetime import datetime, timezone, timedelta

from dotenv import load_dotenv

# Asigură afișarea corectă a diacriticelor în consola Windows (evită UnicodeEncodeError)
for _flux in (sys.stdout, sys.stderr):
    if hasattr(_flux, "reconfigure"):
        try:
            _flux.reconfigure(encoding="utf-8")
        except Exception:
            pass

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from app import create_app  # noqa: E402
from app.extensions import db  # noqa: E402
from app.models import User, Device, Telemetry, Alert  # noqa: E402
from app.services import UNITATI_IMPLICITE  # noqa: E402


DISPOZITIVE_DEMO = [
    {
        "cod_dispozitiv": "rasp-pi-salon",
        "nume": "Senzor climat - Salon",
        "tip": "senzor_climat",
        "locatie": "Salon, Etaj 1",
        "descriere": "Raspberry Pi 5 cu senzor BME280 (temperatură, umiditate, presiune).",
        "praguri": {"temperatura": {"min": 16, "max": 27}, "umiditate": {"min": 30, "max": 65}},
        "metrici": ["temperatura", "umiditate", "presiune"],
        "online": True,
    },
    {
        "cod_dispozitiv": "rasp-pi-exterior",
        "nume": "Stație meteo - Exterior",
        "tip": "statie_meteo",
        "locatie": "Curte, Exterior",
        "descriere": "Stație meteo cu senzori de temperatură, umiditate, luminozitate și vânt.",
        "praguri": {"temperatura": {"min": -10, "max": 38}},
        "metrici": ["temperatura", "umiditate", "luminozitate", "viteza_vant"],
        "online": True,
    },
    {
        "cod_dispozitiv": "rasp-pi-server",
        "nume": "Monitor cameră server",
        "tip": "monitorizare",
        "locatie": "Cameră tehnică, Parter",
        "descriere": "Monitorizează temperatura și umiditatea din camera de servere.",
        "praguri": {"temperatura": {"min": 10, "max": 30}, "umiditate": {"min": 20, "max": 60}},
        "metrici": ["temperatura", "umiditate"],
        "online": True,
    },
    {
        "cod_dispozitiv": "rasp-pi-sera",
        "nume": "Senzor seră legume",
        "tip": "agricultura",
        "locatie": "Seră, Grădină",
        "descriere": "Monitorizare microclimat și nivel apă pentru irigare automată.",
        "praguri": {"temperatura": {"min": 12, "max": 35}, "nivel_apa": {"min": 20, "max": 100}},
        "metrici": ["temperatura", "umiditate", "luminozitate", "nivel_apa"],
        "online": False,
    },
]


def _valoare_metrica(metrica, ora_zi, pas):
    """Generează o valoare realistă pentru o metrică în funcție de ora din zi."""
    diurnal = math.sin((ora_zi - 6) / 24 * 2 * math.pi)  # max la prânz
    if metrica == "temperatura":
        return round(21 + 5 * diurnal + random.uniform(-0.8, 0.8), 1)
    if metrica == "umiditate":
        return round(55 - 12 * diurnal + random.uniform(-3, 3), 1)
    if metrica == "presiune":
        return round(1013 + 4 * math.sin(pas / 20) + random.uniform(-0.5, 0.5), 1)
    if metrica == "luminozitate":
        lumina = max(0, diurnal) * 900
        return round(lumina + random.uniform(0, 50), 0)
    if metrica == "viteza_vant":
        return round(max(0, 8 + 6 * math.sin(pas / 10) + random.uniform(-3, 3)), 1)
    if metrica == "nivel_apa":
        return round(max(5, 90 - pas * 0.4 + random.uniform(-1, 1)), 1)
    return round(random.uniform(0, 100), 1)


def _genereaza_telemetrie(device, metrici):
    """Generează 24h de telemetrie la interval de 15 minute."""
    acum = datetime.now(timezone.utc)
    pasi = 96  # 24h * 4
    randuri = []
    for i in range(pasi):
        moment = acum - timedelta(minutes=15 * (pasi - i))
        ora_zi = moment.hour + moment.minute / 60
        for metrica in metrici:
            valoare = _valoare_metrica(metrica, ora_zi, i)
            randuri.append(
                Telemetry(
                    dispozitiv_id=device.id,
                    metrica=metrica,
                    valoare=valoare,
                    unitate=UNITATI_IMPLICITE.get(metrica),
                    inregistrat_la=moment,
                )
            )
    db.session.bulk_save_objects(randuri)
    db.session.commit()
    return len(randuri)


def ruleaza():
    app = create_app()
    with app.app_context():
        print("Populare bază de date cu date demonstrative...\n")

        # --- Utilizatori ---
        admin = User.query.filter_by(nume_utilizator="admin").first()
        if not admin:
            admin = User(nume_utilizator="admin", email="admin@iot.local", rol="admin")
            admin.seteaza_parola("admin123")
            db.session.add(admin)
            db.session.commit()
            print("Cont ADMIN creat:  utilizator='admin'  parola='admin123'")
        else:
            print("Contul 'admin' există deja.")

        demo = User.query.filter_by(nume_utilizator="demo").first()
        if not demo:
            demo = User(nume_utilizator="demo", email="demo@iot.local", rol="utilizator")
            demo.seteaza_parola("demo123")
            db.session.add(demo)
            db.session.commit()
            print("Cont DEMO creat:   utilizator='demo'   parola='demo123'")

        # --- Dispozitive + telemetrie ---
        print()
        for spec in DISPOZITIVE_DEMO:
            device = Device.query.filter_by(cod_dispozitiv=spec["cod_dispozitiv"]).first()
            if device:
                print(f"Dispozitivul '{spec['cod_dispozitiv']}' există deja - sar peste.")
                continue
            acum = datetime.now(timezone.utc)
            device = Device(
                cod_dispozitiv=spec["cod_dispozitiv"],
                nume=spec["nume"],
                tip=spec["tip"],
                locatie=spec["locatie"],
                descriere=spec["descriere"],
                praguri=spec["praguri"],
                stare="online" if spec["online"] else "offline",
                ultima_vazut=acum if spec["online"] else acum - timedelta(hours=3),
                proprietar_id=admin.id,
            )
            db.session.add(device)
            db.session.commit()
            nr = _genereaza_telemetrie(device, spec["metrici"])
            print(f"Dispozitiv creat: {spec['nume']} ({nr} măsurători generate)")

        # --- Câteva alerte demo ---
        if Alert.query.count() == 0:
            salon = Device.query.filter_by(cod_dispozitiv="rasp-pi-salon").first()
            sera = Device.query.filter_by(cod_dispozitiv="rasp-pi-sera").first()
            alerte = [
                Alert(
                    dispozitiv_id=salon.id,
                    tip="prag_depasit",
                    severitate="critic",
                    mesaj="[Senzor climat - Salon] Temperatura = 28.4°C a depășit pragul maxim (27°C)",
                    metrica="temperatura",
                    valoare=28.4,
                    creat_la=datetime.now(timezone.utc) - timedelta(hours=2),
                ),
                Alert(
                    dispozitiv_id=sera.id,
                    tip="dispozitiv_offline",
                    severitate="avertisment",
                    mesaj="Dispozitivul „Senzor seră legume” nu mai răspunde (offline).",
                    creat_la=datetime.now(timezone.utc) - timedelta(hours=3),
                ),
            ]
            db.session.bulk_save_objects(alerte)
            db.session.commit()
            print("\n2 alerte demonstrative create.")

        print("\nPopulare finalizată cu succes!")


if __name__ == "__main__":
    ruleaza()
