"""Instanțele extensiilor Flask, inițializate în fabrica de aplicații."""
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_socketio import SocketIO

db = SQLAlchemy()
jwt = JWTManager()
cors = CORS()
# async_mode="threading" pentru a evita dependențele eventlet/gevent (compatibil Windows + Raspberry Pi)
socketio = SocketIO(cors_allowed_origins="*", async_mode="threading")
