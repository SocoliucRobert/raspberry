"""Client MQTT care ascultă telemetria dispozitivelor IoT.

Topice abonate:
    iot/<cod_dispozitiv>/telemetry  -> măsurători senzori (JSON)
    iot/<cod_dispozitiv>/status     -> online / offline

Topic pentru comenzi (publicare către dispozitiv):
    iot/<cod_dispozitiv>/command
"""
import json
import logging

import paho.mqtt.client as mqtt

from ..services import proceseaza_telemetrie, proceseaza_status

logger = logging.getLogger(__name__)

_client = None

TOPIC_TELEMETRIE = "iot/+/telemetry"
TOPIC_STATUS = "iot/+/status"


def init_mqtt(app):
    """Inițializează și pornește clientul MQTT în fundal."""
    global _client

    if not app.config.get("MQTT_ENABLED", True):
        logger.info("MQTT este dezactivat prin configurare (MQTT_ENABLED=false).")
        return None

    host = app.config["MQTT_BROKER_HOST"]
    port = app.config["MQTT_BROKER_PORT"]
    username = app.config.get("MQTT_USERNAME")
    password = app.config.get("MQTT_PASSWORD")

    client = mqtt.Client(client_id="platforma-iot-backend", clean_session=True)
    if username:
        client.username_pw_set(username, password)

    def on_connect(cli, userdata, flags, rc):
        if rc == 0:
            logger.info("Conectat la brokerul MQTT %s:%s", host, port)
            cli.subscribe([(TOPIC_TELEMETRIE, 0), (TOPIC_STATUS, 0)])
            logger.info("Abonat la topicele: %s, %s", TOPIC_TELEMETRIE, TOPIC_STATUS)
        else:
            logger.error("Conectare MQTT eșuată (cod %s)", rc)

    def on_disconnect(cli, userdata, rc):
        if rc != 0:
            logger.warning("Deconectat de la broker MQTT (cod %s). Se reîncearcă...", rc)

    def on_message(cli, userdata, msg):
        try:
            parti = msg.topic.split("/")
            if len(parti) != 3 or parti[0] != "iot":
                return
            cod_dispozitiv, tip = parti[1], parti[2]
            payload = msg.payload.decode("utf-8", errors="ignore")

            with app.app_context():
                if tip == "telemetry":
                    try:
                        date = json.loads(payload)
                    except json.JSONDecodeError:
                        logger.warning("Payload telemetrie invalid pe %s: %s", msg.topic, payload)
                        return
                    if isinstance(date, dict):
                        proceseaza_telemetrie(cod_dispozitiv, date)
                elif tip == "status":
                    proceseaza_status(cod_dispozitiv, payload)
        except Exception:
            logger.exception("Eroare la procesarea mesajului MQTT pe topicul %s", msg.topic)

    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message

    try:
        client.connect(host, port, keepalive=60)
        client.loop_start()
        logger.info("Client MQTT pornit.")
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "Nu m-am putut conecta la brokerul MQTT (%s:%s): %s. "
            "Pornește Mosquitto pentru a primi telemetrie în timp real.",
            host,
            port,
            exc,
        )

    _client = client
    app.extensions["mqtt_client"] = client
    return client


def publica_comanda(cod_dispozitiv: str, comanda: dict) -> bool:
    """Publică o comandă către un dispozitiv prin MQTT."""
    if _client is None:
        logger.warning("Client MQTT indisponibil; comanda nu a fost trimisă.")
        return False
    topic = f"iot/{cod_dispozitiv}/command"
    rezultat = _client.publish(topic, json.dumps(comanda))
    return rezultat.rc == mqtt.MQTT_ERR_SUCCESS
