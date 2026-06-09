"""Fabrica aplicației Flask pentru platforma IoT."""
import logging

from flask import Flask, jsonify

from .config import get_config
from .extensions import db, jwt, cors, socketio


def create_app():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    app = Flask(__name__)
    app.config.from_object(get_config())

    # Inițializare extensii
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True,
    )
    socketio.init_app(app, cors_allowed_origins=app.config["CORS_ORIGINS"])

    _inregistreaza_handlere_jwt()
    _inregistreaza_blueprints(app)
    _inregistreaza_handlere_erori(app)

    # Creează tabelele dacă nu există
    from . import models  # noqa: F401 (asigură încărcarea modelelor)

    with app.app_context():
        db.create_all()

    @app.get("/api/sanatate")
    def sanatate():
        return jsonify({"stare": "ok", "serviciu": "platforma-iot", "versiune": "1.0.0"})

    return app


def _inregistreaza_blueprints(app):
    from .api.auth import auth_bp
    from .api.devices import devices_bp
    from .api.alerts import alerts_bp
    from .api.dashboard import dashboard_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(devices_bp, url_prefix="/api/dispozitive")
    app.register_blueprint(alerts_bp, url_prefix="/api/alerte")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")


def _inregistreaza_handlere_jwt():
    @jwt.unauthorized_loader
    def lipsa_token(motiv):
        return jsonify({"eroare": "Autentificare necesară. Te rog să te conectezi."}), 401

    @jwt.invalid_token_loader
    def token_invalid(motiv):
        return jsonify({"eroare": "Token de autentificare invalid."}), 401

    @jwt.expired_token_loader
    def token_expirat(antet, payload):
        return jsonify({"eroare": "Sesiunea a expirat. Te rog să te conectezi din nou."}), 401


def _inregistreaza_handlere_erori(app):
    @app.errorhandler(404)
    def negasit(_):
        return jsonify({"eroare": "Resursa solicitată nu a fost găsită."}), 404

    @app.errorhandler(405)
    def metoda_nepermisa(_):
        return jsonify({"eroare": "Metodă HTTP nepermisă pentru această rută."}), 405

    @app.errorhandler(500)
    def eroare_server(_):
        db.session.rollback()
        return jsonify({"eroare": "Eroare internă a serverului."}), 500
