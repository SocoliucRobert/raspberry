"""Elimină dispozitivele demonstrative din baza de date.

Rulează:  python cleanup.py"""
import os
import sys

# Asigură afișarea corectă a diacriticelor în consola Windows
for _flux in (sys.stdout, sys.stderr):
    if hasattr(_flux, "reconfigure"):
        try:
            _flux.reconfigure(encoding="utf-8")
        except Exception:
            pass

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from app import create_app  # noqa: E402
from app.extensions import db  # noqa: E402
from app.models import Device  # noqa: E402

CODURI_DEMO = ["rasp-pi-salon", "rasp-pi-exterior", "rasp-pi-server", "rasp-pi-sera"]


def ruleaza():
    app = create_app()
    with app.app_context():
        for cod in CODURI_DEMO:
            device = Device.query.filter_by(cod_dispozitiv=cod).first()
            if device:
                db.session.delete(device)
                db.session.commit()
                print(f"Dispozitiv șters: {cod}")
            else:
                print(f"Dispozitiv inexistent (deja șters): {cod}")
        print("\nCurățare finalizată.")


if __name__ == "__main__":
    ruleaza()
