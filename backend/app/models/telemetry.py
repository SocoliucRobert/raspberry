"""Modelul de telemetrie (măsurători time-series de la senzori)."""
from datetime import datetime, timezone

from ..extensions import db


def _acum():
    return datetime.now(timezone.utc)


class Telemetry(db.Model):
    __tablename__ = "telemetrie"

    id = db.Column(db.BigInteger().with_variant(db.Integer, "sqlite"), primary_key=True)
    dispozitiv_id = db.Column(
        db.Integer,
        db.ForeignKey("dispozitive.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    metrica = db.Column(db.String(60), nullable=False, index=True)  # ex: temperatura
    valoare = db.Column(db.Float, nullable=False)
    unitate = db.Column(db.String(20))  # ex: °C, %, hPa
    inregistrat_la = db.Column(
        db.DateTime(timezone=True), default=_acum, nullable=False, index=True
    )

    dispozitiv = db.relationship("Device", back_populates="telemetrie")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "dispozitiv_id": self.dispozitiv_id,
            "metrica": self.metrica,
            "valoare": self.valoare,
            "unitate": self.unitate,
            "inregistrat_la": self.inregistrat_la.isoformat()
            if self.inregistrat_la
            else None,
        }

    def __repr__(self) -> str:
        return f"<Telemetrie {self.metrica}={self.valoare}{self.unitate or ''}>"
