"""Modelul de alerte generate de platformă."""
from datetime import datetime, timezone

from ..extensions import db


def _acum():
    return datetime.now(timezone.utc)


class Alert(db.Model):
    __tablename__ = "alerte"

    id = db.Column(db.Integer, primary_key=True)
    dispozitiv_id = db.Column(
        db.Integer,
        db.ForeignKey("dispozitive.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tip = db.Column(db.String(40), nullable=False)  # prag_depasit / dispozitiv_offline / dispozitiv_online
    severitate = db.Column(db.String(20), nullable=False, default="avertisment")  # info / avertisment / critic
    mesaj = db.Column(db.Text, nullable=False)
    metrica = db.Column(db.String(60))
    valoare = db.Column(db.Float)
    citita = db.Column(db.Boolean, default=False, nullable=False, index=True)
    creat_la = db.Column(db.DateTime(timezone=True), default=_acum, index=True)

    dispozitiv = db.relationship("Device", back_populates="alerte")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "dispozitiv_id": self.dispozitiv_id,
            "nume_dispozitiv": self.dispozitiv.nume if self.dispozitiv else None,
            "tip": self.tip,
            "severitate": self.severitate,
            "mesaj": self.mesaj,
            "metrica": self.metrica,
            "valoare": self.valoare,
            "citita": self.citita,
            "creat_la": self.creat_la.isoformat() if self.creat_la else None,
        }

    def __repr__(self) -> str:
        return f"<Alerta {self.tip} ({self.severitate})>"
