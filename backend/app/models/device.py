"""Modelul dispozitivului IoT."""
from datetime import datetime, timezone

from ..extensions import db


def _acum():
    return datetime.now(timezone.utc)


class Device(db.Model):
    __tablename__ = "dispozitive"

    id = db.Column(db.Integer, primary_key=True)
    # Identificator unic folosit în topicele MQTT (ex: rasp-pi-01)
    cod_dispozitiv = db.Column(db.String(120), unique=True, nullable=False, index=True)
    nume = db.Column(db.String(120), nullable=False)
    tip = db.Column(db.String(60), nullable=False, default="senzor")
    locatie = db.Column(db.String(160))
    descriere = db.Column(db.Text)
    stare = db.Column(db.String(20), nullable=False, default="offline")  # online / offline
    ultima_vazut = db.Column(db.DateTime(timezone=True))
    # Praguri de alertare pe metrică: {"temperatura": {"min": 5, "max": 35}}
    praguri = db.Column(db.JSON, default=dict)
    creat_la = db.Column(db.DateTime(timezone=True), default=_acum)

    proprietar_id = db.Column(
        db.Integer, db.ForeignKey("utilizatori.id"), nullable=False, index=True
    )

    proprietar = db.relationship("User", back_populates="dispozitive")
    telemetrie = db.relationship(
        "Telemetry",
        back_populates="dispozitiv",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    alerte = db.relationship(
        "Alert",
        back_populates="dispozitiv",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def to_dict(self, include_ultima_telemetrie: bool = False) -> dict:
        date = {
            "id": self.id,
            "cod_dispozitiv": self.cod_dispozitiv,
            "nume": self.nume,
            "tip": self.tip,
            "locatie": self.locatie,
            "descriere": self.descriere,
            "stare": self.stare,
            "ultima_vazut": self.ultima_vazut.isoformat() if self.ultima_vazut else None,
            "praguri": self.praguri or {},
            "creat_la": self.creat_la.isoformat() if self.creat_la else None,
            "proprietar_id": self.proprietar_id,
        }
        if include_ultima_telemetrie:
            from .telemetry import Telemetry

            ultimele = (
                Telemetry.query.filter_by(dispozitiv_id=self.id)
                .order_by(Telemetry.inregistrat_la.desc())
                .limit(20)
                .all()
            )
            # Cea mai recentă valoare pentru fiecare metrică
            recente = {}
            for t in ultimele:
                if t.metrica not in recente:
                    recente[t.metrica] = {
                        "valoare": t.valoare,
                        "unitate": t.unitate,
                        "inregistrat_la": t.inregistrat_la.isoformat()
                        if t.inregistrat_la
                        else None,
                    }
            date["valori_curente"] = recente
        return date

    def __repr__(self) -> str:
        return f"<Dispozitiv {self.cod_dispozitiv} ({self.stare})>"
