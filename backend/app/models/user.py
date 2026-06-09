"""Modelul utilizatorului platformei."""
from datetime import datetime, timezone

from werkzeug.security import generate_password_hash, check_password_hash

from ..extensions import db


def _acum():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "utilizatori"

    id = db.Column(db.Integer, primary_key=True)
    nume_utilizator = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    parola_hash = db.Column(db.String(255), nullable=False)
    rol = db.Column(db.String(20), nullable=False, default="utilizator")  # admin / utilizator
    creat_la = db.Column(db.DateTime(timezone=True), default=_acum)

    dispozitive = db.relationship(
        "Device", back_populates="proprietar", cascade="all, delete-orphan"
    )

    def seteaza_parola(self, parola: str) -> None:
        self.parola_hash = generate_password_hash(parola)

    def verifica_parola(self, parola: str) -> bool:
        return check_password_hash(self.parola_hash, parola)

    @property
    def este_admin(self) -> bool:
        return self.rol == "admin"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "nume_utilizator": self.nume_utilizator,
            "email": self.email,
            "rol": self.rol,
            "creat_la": self.creat_la.isoformat() if self.creat_la else None,
        }

    def __repr__(self) -> str:
        return f"<Utilizator {self.nume_utilizator}>"
