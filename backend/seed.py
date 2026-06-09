"""Populează baza de date cu date demonstrative.

Rulează:  python seed.py
Creează conturi demo, dispozitive și istoric de telemetrie pentru testare.
"""
import os
import sys
from datetime import datetime, timezone

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
from app.models import User  # noqa: E402


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

        print("\nPopulare finalizată cu succes!")


if __name__ == "__main__":
    ruleaza()
