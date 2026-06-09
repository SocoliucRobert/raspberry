"""Servicii cu logica de business a platformei."""
from .telemetrie_service import (
    proceseaza_telemetrie,
    proceseaza_status,
    verifica_dispozitive_offline,
    UNITATI_IMPLICITE,
)

__all__ = [
    "proceseaza_telemetrie",
    "proceseaza_status",
    "verifica_dispozitive_offline",
    "UNITATI_IMPLICITE",
]
