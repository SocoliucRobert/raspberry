"""Punctul de intrare al serverului backend.

Pornește serverul Flask + SocketIO, clientul MQTT și task-ul de monitorizare
a dispozitivelor offline.
"""
import os
import sys
import logging

from dotenv import load_dotenv

# Asigură afișarea corectă a diacriticelor în consola Windows (evită UnicodeEncodeError)
for _flux in (sys.stdout, sys.stderr):
    if hasattr(_flux, "reconfigure"):
        try:
            _flux.reconfigure(encoding="utf-8")
        except Exception:
            pass

# Încarcă variabilele din fișierul .env aflat lângă acest script
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from app import create_app  # noqa: E402
from app.extensions import socketio  # noqa: E402
from app.mqtt import init_mqtt  # noqa: E402
from app.services import verifica_dispozitive_offline  # noqa: E402

logger = logging.getLogger(__name__)

app = create_app()


def _monitorizare_offline():
    """Verifică periodic dispozitivele care nu mai trimit date."""
    while True:
        socketio.sleep(30)
        try:
            verifica_dispozitive_offline(app)
        except Exception:  # noqa: BLE001
            logger.exception("Eroare în task-ul de monitorizare offline")


if __name__ == "__main__":
    # Pornește clientul MQTT
    init_mqtt(app)
    # Pornește monitorizarea în fundal
    socketio.start_background_task(_monitorizare_offline)

    port = int(os.getenv("PORT", "5000"))
    logger.info("Pornire server pe http://0.0.0.0:%s", port)
    socketio.run(
        app,
        host="0.0.0.0",
        port=port,
        use_reloader=False,
        allow_unsafe_werkzeug=True,
    )
