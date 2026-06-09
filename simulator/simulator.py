"""Simulator de dispozitive IoT.

Publică telemetrie realistă pe brokerul MQTT pentru dispozitivele demo,
permițând testarea platformei fără hardware fizic.

Utilizare:
    python simulator.py
    python simulator.py --broker 192.168.1.10 --port 1883 --interval 5
"""
import argparse
import signal
import sys
import time

import paho.mqtt.client as mqtt

# Asigură afișarea corectă a diacriticelor în consola Windows (evită UnicodeEncodeError)
for _flux in (sys.stdout, sys.stderr):
    if hasattr(_flux, "reconfigure"):
        try:
            _flux.reconfigure(encoding="utf-8")
        except Exception:
            pass

_ruleaza = True


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

    print("Simulator pornit. (Ctrl+C pentru oprire)")
    print("Adaugă dispozitive manual prin interfață și specifică codul în acest script.")

    try:
        while _ruleaza:
            time.sleep(1)
    finally:
        print("\nOprire simulator.")
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
