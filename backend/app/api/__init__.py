"""Pachetul cu rutele API REST."""
from flask_jwt_extended import get_jwt_identity

from ..models import User


def utilizator_curent():
    """Returnează utilizatorul autentificat curent (sau None)."""
    uid = get_jwt_identity()
    if uid is None:
        return None
    try:
        return db_get_user(int(uid))
    except (TypeError, ValueError):
        return None


def db_get_user(uid):
    return User.query.get(uid)
