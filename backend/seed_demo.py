"""Generează 3 dispozitive demo cu telemetrie și alerte.

Rulare:
    cd backend
    .venv\Scripts\python.exe seed_demo.py

Ștergere:
    .venv\Scripts\python.exe seed_demo.py --cleanup
"""
import sys
import random
from datetime import datetime, timezone, timedelta

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.device import Device
from app.models.telemetry import Telemetry
from app.models.alert import Alert

app = create_app()


def _acum():
    return datetime.now(timezone.utc)


DEMO_DISP = [
    {
        "cod": "rpi5-lab-01",
        "nume": "Raspberry Pi 5 — Laborator 101",
        "tip": "senzor",
        "locatie": "Laborator 101, Clădirea A",
        "descriere": "Senzor ambiental cu DHT22 și BMP280 pentru temperatură, umiditate și presiune.",
        "stare": "online",
        "praguri": {"temperatura": {"min": 18, "max": 28}, "umiditate": {"min": 30, "max": 70}},
        "metrici": [
            ("temperatura", "°C", 22.0, 3.0),
            ("umiditate", "%", 45.0, 8.0),
            ("presiune", "hPa", 1013.0, 5.0),
        ],
    },
    {
        "cod": "rpi5-hall-02",
        "nume": "Raspberry Pi 5 — Hol Principal",
        "tip": "senzor",
        "locatie": "Hol Principal, Clădirea B",
        "descriere": "Monitorizare calitate aer cu senzor MQ-135 și măsurători de temperatură.",
        "stare": "online",
        "praguri": {"temperatura": {"min": 19, "max": 26}, "calitate_aer": {"min": 0, "max": 300}},
        "metrici": [
            ("temperatura", "°C", 21.5, 2.5),
            ("calitate_aer", "AQI", 120.0, 40.0),
        ],
    },
    {
        "cod": "rpi5-server-03",
        "nume": "Raspberry Pi 5 — Cameră Server",
        "tip": "server",
        "locatie": "Cameră Server, Clădirea C",
        "descriere": "Monitorizare temperatură CPU și sistem pentru server edge.",
        "stare": "offline",
        "praguri": {"cpu_temp": {"min": 30, "max": 75}},
        "metrici": [
            ("cpu_temp", "°C", 55.0, 10.0),
            ("cpu_load", "%", 35.0, 15.0),
            ("ram_usage", "%", 42.0, 12.0),
        ],
    },
]

ALERTE_DEMO = [
    {
        "cod": "rpi5-server-03",
        "tip": "dispozitiv_offline",
        "severitate": "critic",
        "mesaj": "Dispozitivul 'Raspberry Pi 5 — Cameră Server' nu a trimis date de 5 minute.",
    },
    {
        "cod": "rpi5-lab-01",
        "tip": "prag_depasit",
        "severitate": "avertisment",
        "mesaj": "Temperatura a depășit pragul maxim (28 °C) în Laborator 101.",
        "metrica": "temperatura",
        "valoare": 29.3,
    },
]


def gaseste_sau_creeaza_user():
    """Găsește primul user admin sau creează unul demo."""
    u = User.query.filter_by(rol="admin").first()
    if u:
        return u
    u = User.query.filter_by(email="demo@usu.ro").first()
    if u:
        return u
    u = User(
        nume_utilizator="demo_usu",
        email="demo@usu.ro",
        parola_hash="",
        rol="utilizator",
    )
    db.session.add(u)
    db.session.commit()
    print(f"[USER] Creat utilizator demo: {u.email} (id={u.id})")
    return u


def genereaza_telemetrie(device, metrici, numar=20):
    """Generează `numar` înregistrări de telemetrie cu timestamp-uri descrescătoare."""
    now = _acum()
    for i in range(numar, 0, -1):
        for metrica, unitate, medie, dev in metrici:
            val = round(random.gauss(medie, dev), 2)
            # injectează câteva spike-uri pentru realism
            if random.random() < 0.05:
                val = round(val + random.uniform(8, 15), 2)
            t = Telemetry(
                dispozitiv_id=device.id,
                metrica=metrica,
                valoare=val,
                unitate=unitate,
                inregistrat_la=now - timedelta(minutes=i * 5),
            )
            db.session.add(t)
    device.ultima_vazut = now


def creeaza_alertele(device, alerte_template):
    for tmpl in alerte_template:
        if tmpl["cod"] != device.cod_dispozitiv:
            continue
        a = Alert(
            dispozitiv_id=device.id,
            tip=tmpl["tip"],
            severitate=tmpl["severitate"],
            mesaj=tmpl["mesaj"],
            metrica=tmpl.get("metrica"),
            valoare=tmpl.get("valoare"),
            citita=random.choice([True, False]),
            creat_la=_acum() - timedelta(minutes=random.randint(5, 120)),
        )
        db.session.add(a)


def seed():
    with app.app_context():
        user = gaseste_sau_creeaza_user()
        adaugate = 0

        for info in DEMO_DISP:
            existent = Device.query.filter_by(cod_dispozitiv=info["cod"]).first()
            if existent:
                print(f"[SKIP] '{info['cod']}' există deja (id={existent.id})")
                continue

            d = Device(
                cod_dispozitiv=info["cod"],
                nume=info["nume"],
                tip=info["tip"],
                locatie=info["locatie"],
                descriere=info["descriere"],
                stare=info["stare"],
                praguri=info["praguri"],
                proprietar_id=user.id,
            )
            db.session.add(d)
            db.session.flush()  # obține id-ul fără commit final

            genereaza_telemetrie(d, info["metrici"], numar=20)
            creeaza_alertele(d, ALERTE_DEMO)

            db.session.commit()
            adaugate += 1
            print(f"[ADD] '{info['cod']}' — {info['nume']} (id={d.id})")

        if adaugate == 0:
            print("Toate dispozitivele demo există deja. Nimic de adăugat.")
        else:
            print(f"\n✅ Gata — {adaugate} dispozitive adăugate cu telemetrie și alerte.")


def cleanup():
    with app.app_context():
        for info in DEMO_DISP:
            d = Device.query.filter_by(cod_dispozitiv=info["cod"]).first()
            if d:
                db.session.delete(d)
                db.session.commit()
                print(f"[DEL] Șters '{info['cod']}' (id={d.id})")
        print("\n🧹 Demo dispozitive șterse.")


if __name__ == "__main__":
    if "--cleanup" in sys.argv:
        cleanup()
    else:
        seed()
