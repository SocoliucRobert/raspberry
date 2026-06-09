"""Client MQTT pentru Raspberry Pi 5.

Citește metrici de sistem (temperatură CPU, utilizare CPU/RAM/disk)
și le publică pe brokerul MQTT al platformei IoT.

Rulare manuală:
    python client.py

Pentru rulare automată la pornire (systemd), vezi README.
"""
import json
import os
import signal
import sys
import time
from datetime import datetime, timezone

import paho.mqtt.client as mqtt
import psutil
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Configurare
# ---------------------------------------------------------------------------
ENV_PATH = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(ENV_PATH):
    load_dotenv(ENV_PATH)

BROKER = os.getenv("BROKER_MQTT", "localhost")
PORT = int(os.getenv("PORT_MQTT", "1883"))
COD_DISPOZITIV = os.getenv("COD_DISPOZITIV", "rpi5-default")
INTERVAL = float(os.getenv("INTERVAL", "10"))
USERNAME = os.getenv("USERNAME_MQTT") or None
PASSWORD = os.getenv("PASSWORD_MQTT") or None

TOPIC_TELEMETRY = f"iot/{COD_DISPOZITIV}/telemetry"
TOPIC_STATUS = f"iot/{COD_DISPOZITIV}/status"

_client = None
_ruleaza = True


def _citeste_temperatura_cpu():
    """Citește temperatura CPU de pe Raspberry Pi.

    Căile verificate (în ordine):
      - /sys/class/thermal/thermal_zone0/temp  (standard pe Pi)
      - vcgencmd measure_temp                   (comandă oficială Broadcom)
      - psutil.sensors_temperatures()             (fallback generic Linux)
    """
    # 1. thermal_zone0 (cel mai rapid, fără subprocess)
    try:
        with open("/sys/class/thermal/thermal_zone0/temp", "r") as f:
            temp_millidegrees = int(f.read().strip())
            return round(temp_millidegrees / 1000.0, 1)
    except Exception:
        pass

    # 2. vcgencmd (comandă Raspberry Pi OS)
    try:
        import subprocess
        out = subprocess.check_output(["vcgencmd", "measure_temp"], text=True)
        # output: temp=45.6'C
        val = out.split("=")[1].split("'")[0]
        return round(float(val), 1)
    except Exception:
        pass

    # 3. psutil sensors (fallback generic)
    try:
        temps = psutil.sensors_temperatures()
        for name, entries in temps.items():
            for entry in entries:
                if entry.current is not None:
                    return round(entry.current, 1)
    except Exception:
        pass

    return None


def _citeste_metrici():
    """Colectează toate metricile de sistem disponibile."""
    acum = datetime.now(timezone.utc)
    metrici = {"timestamp": acum.isoformat()}

    temp = _citeste_temperatura_cpu()
    if temp is not None:
        metrici["temperatura_cpu"] = temp

    metrici["utilizare_cpu"] = round(psutil.cpu_percent(interval=1), 1)

    mem = psutil.virtual_memory()
    metrici["memorie_ram_pct"] = round(mem.percent, 1)
    metrici["memorie_ram_mb"] = round(mem.used / (1024 * 1024), 1)

    disk = psutil.disk_usage("/")
    metrici["utilizare_disk_pct"] = round(disk.percent, 1)

    try:
        load1, _, _ = os.getloadavg()
        metrici["load_avg_1m"] = round(load1, 2)
    except AttributeError:
        pass  # Windows nu are getloadavg

    return metrici


def _on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"[MQTT] Conectat la {BROKER}:{PORT}")
        client.publish(TOPIC_STATUS, "online", retain=True)
        print(f"[MQTT] Status: online -> {TOPIC_STATUS}")
    else:
        print(f"[MQTT] Eroare conectare, cod: {rc}")


def _on_disconnect(client, userdata, rc):
    if rc != 0:
        print(f"[MQTT] Deconectat neașteptat (cod {rc}), se reîncearcă...")


def _on_publish(client, userdata, mid):
    pass


def _opreste(signum, frame):
    global _ruleaza
    _ruleaza = False


def main():
    global _client, _ruleaza

    print(f"=" * 50)
    print(f"Client Raspberry Pi 5 - Platformă IoT")
    print(f"Dispozitiv: {COD_DISPOZITIV}")
    print(f"Broker:     {BROKER}:{PORT}")
    print(f"Interval:   {INTERVAL}s")
    print(f"=" * 50)

    signal.signal(signal.SIGINT, _opreste)
    signal.signal(signal.SIGTERM, _opreste)

    _client = mqtt.Client(client_id=f"rpi5-{COD_DISPOZITIV}")
    _client.on_connect = _on_connect
    _client.on_disconnect = _on_disconnect
    _client.on_publish = _on_publish

    if USERNAME:
        _client.username_pw_set(USERNAME, PASSWORD)

    # Încercare conectare cu retry automat
    conectat = False
    while not conectat and _ruleaza:
        try:
            _client.connect(BROKER, PORT, keepalive=60)
            conectat = True
        except Exception as exc:
            print(f"[MQTT] Nu m-am putut conecta: {exc}")
            print(f"[MQTT] Reîncerc în 5 secunde...")
            time.sleep(5)

    if not conectat:
        print("[Eroare] Nu s-a putut realiza conexiunea. Ieșire.")
        sys.exit(1)

    _client.loop_start()

    try:
        while _ruleaza:
            metrici = _citeste_metrici()
            payload = json.dumps(metrici)
            _client.publish(TOPIC_TELEMETRY, payload)
            print(f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] {payload}")

            # Așteptare întreruptibilă
            ramas = INTERVAL
            while ramas > 0 and _ruleaza:
                time.sleep(min(1.0, ramas))
                ramas -= 1.0
    finally:
        print("\n[Oprire] Public status offline...")
        _client.publish(TOPIC_STATUS, "offline", retain=True)
        _client.loop_stop()
        _client.disconnect()
        print("[Oprire] Client deconectat.")


if __name__ == "__main__":
    main()
