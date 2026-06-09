"""Configurarea aplicației Flask, încărcată din variabile de mediu."""
import os
from datetime import timedelta


def _normalize_db_url(url: str) -> str:
    """Acceptă schema veche `postgres://` și o convertește la `postgresql://`."""
    if url and url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


class Config:
    # --- Securitate ---
    SECRET_KEY = os.getenv("SECRET_KEY", "schimba-aceasta-cheie-secreta")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "schimba-aceasta-cheie-jwt")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv("JWT_EXPIRES_HOURS", "12")))

    # --- Baza de date ---
    SQLALCHEMY_DATABASE_URI = _normalize_db_url(
        os.getenv("DATABASE_URL", "postgresql://iot_user:iot_parola@localhost:5432/iot_platforma")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

    # --- MQTT ---
    MQTT_ENABLED = os.getenv("MQTT_ENABLED", "true").lower() == "true"
    MQTT_BROKER_HOST = os.getenv("MQTT_BROKER_HOST", "localhost")
    MQTT_BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", "1883"))
    MQTT_USERNAME = os.getenv("MQTT_USERNAME") or None
    MQTT_PASSWORD = os.getenv("MQTT_PASSWORD") or None

    # --- Monitorizare ---
    DEVICE_OFFLINE_TIMEOUT = int(os.getenv("DEVICE_OFFLINE_TIMEOUT", "90"))

    # --- CORS ---
    CORS_ORIGINS = [
        o.strip()
        for o in os.getenv(
            "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",")
        if o.strip()
    ]


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


def get_config():
    """Returnează clasa de configurare în funcție de FLASK_ENV."""
    env = os.getenv("FLASK_ENV", "development").lower()
    if env == "production":
        return ProductionConfig
    return DevelopmentConfig
