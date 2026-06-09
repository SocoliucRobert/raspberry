"""Simulator de dispozitive IoT.

Publică telemetrie realistă pe brokerul MQTT pentru dispozitivele demo,
permițând testarea platformei fără hardware fizic.

Utilizare:
    python simulator.py
    python simulator.py --broker 192.168.1.10 --port 1883 --interval 5
"""
import argparse
import json
import math
import random
import signal
import sys
import time
from datetime import datetime, timezone

import paho.mqtt.client as mqtt

# Asigură afișarea corectă a diacriticelor în consola Windows (evită UnicodeEncodeError)
for _flux in (sys.stdout, sys.stderr):
    if hasattr(_flux, "reconfigure"):
        try:
            _flux.reconfigure(encoding="utf-8")
        except Exception:
            pass

# Dispozitivele simulate (trebuie să existe în platformă - vezi seed.py)
DISPOZITIVE = [
    {"cod": "rasp-pi-salon", "metrici": ["temperatura", "umiditate", "presiune"]},
    {
        "cod": "rasp-pi-exterior",
        "metrici": ["temperatura", "umiditate", "luminozitate", "viteza_vant"],
    },
    {"cod": "rasp-pi-server", "metrici": ["temperatura", "umiditate"]},
]

_ruleaza = True


def _valoare(metrica, ora_zi, pas):
    """Generează o valoare realistă în funcție de ora din zi."""
    diurnal = math.sin((ora_zi - 6) / 24 * 2 * math.pi)
    if metrica == "temperatura":
        return round(21 + 5 * diurnal + random.uniform(-0.6, 0.6), 1)
    if metrica == "umiditate":
        return round(55 - 12 * diurnal + random.uniform(-2, 2), 1)
    if metrica == "presiune":
        return round(1013 + 4 * math.sin(pas / 20) + random.uniform(-0.4, 0.4), 1)
    if metrica == "luminozitate":
        return round(max(0, diurnal) * 900 + random.uniform(0, 40), 0)
    if metrica == "viteza_vant":
        return round(max(0, 8 + 6 * math.sin(pas / 10) + random.uniform(-3, 3)), 1)
    if metrica == "nivel_apa":
        return round(max(5, 70 + 20 * math.sin(pas / 30) + random.uniform(-1, 1)), 1)
    return round(random.uniform(0, 100), 1)


def _opreste(signum, frame):
    global _ruleaza
    _ruleaza = False


def main():
    parser = argparse.ArgumentParser(description="Simulator dispozitive IoT (MQTT)")
    parser.add_argument("--broker", default="localhost", help="Adresa brokerului MQTT")
    parser.add_argument("--port", type=int, default=1883, help="Portul brokerului MQTT")
    parser.add_argument(
        "--interval", type=float, default=5.0, help="Interval între măsurători (secunde)"
    )
    parser.add_argument("--username", default=None, help="Utilizator MQTT (opțional)")
    parser.add_argument("--password", default=None, help="Parolă MQTT (opțional)")
    args = parser.parse_args()

    signal.signal(signal.SIGINT, _opreste)
    signal.signal(signal.SIGTERM, _opreste)

    client = mqtt.Client(client_id="simulator-iot")
    if args.username:
        client.username_pw_set(args.username, args.password)

    print(f"Conectare la brokerul MQTT {args.broker}:{args.port} ...")
    try:
        client.connect(args.broker, args.port, 60)
    except Exception as exc:  # noqa: BLE001
        print(f"EROARE: nu m-am putut conecta la broker: {exc}")
        print("Verifică dacă Mosquitto rulează și dacă adresa/portul sunt corecte.")
        sys.exit(1)

    client.loop_start()

    # Marchează dispozitivele ca online
    for d in DISPOZITIVE:
        client.publish(f"iot/{d['cod']}/status", "online", retain=True)

    print(f"Simulator pornit. Publică la fiecare {args.interval}s. (Ctrl+C pentru oprire)\n")

    pas = 0
    try:
        while _ruleaza:
            acum = datetime.now(timezone.utc)
            ora_zi = acum.hour + acum.minute / 60
            for d in DISPOZITIVE:
                payload = {m: _valoare(m, ora_zi, pas) for m in d["metrici"]}
                topic = f"iot/{d['cod']}/telemetry"
                client.publish(topic, json.dumps(payload))
                print(f"  {acum.strftime('%H:%M:%S')}  {d['cod']:18s} -> {payload}")
            print("")
            pas += 1
            # Așteptare întreruptibilă
            ramas = args.interval
            while ramas > 0 and _ruleaza:
                time.sleep(min(0.2, ramas))
                ramas -= 0.2
    finally:
        print("\nOprire simulator... marchez dispozitivele ca offline.")
        for d in DISPOZITIVE:
            client.publish(f"iot/{d['cod']}/status", "offline", retain=True)
        time.sleep(0.5)
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
