# Platformă Cloud pentru Gestionarea și Monitorizarea Dispozitivelor IoT

Platformă completă pentru conectarea, monitorizarea și controlul dispozitivelor IoT
(Raspberry Pi 5, ESP32, senzori), cu **telemetrie în timp real**, **alerte
inteligente** și **interfață complet în limba română**.

| Componentă | Tehnologie |
|------------|------------|
| Frontend   | React 18 + Vite + TailwindCSS + Recharts |
| Backend    | Flask (Python) + SocketIO + JWT |
| Bază de date | PostgreSQL |
| Comunicație IoT | MQTT (Mosquitto) |
| Hardware țintă | Raspberry Pi 5 (2 GB) |

---

## Cuprins

- [Arhitectură](#arhitectură)
- [Cerințe](#cerințe)
- [Instalare rapidă](#instalare-rapidă)
- [1. Servicii de infrastructură (PostgreSQL + MQTT)](#1-servicii-de-infrastructură)
- [2. Backend (Flask)](#2-backend-flask)
- [3. Frontend (React)](#3-frontend-react)
- [4. Simulator de dispozitive](#4-simulator-de-dispozitive)
- [Conturi demo](#conturi-demo)
- [Conectarea dispozitivelor reale](#conectarea-dispozitivelor-reale)
- [Structura proiectului](#structura-proiectului)
- [Deployment pe Raspberry Pi 5](#deployment-pe-raspberry-pi-5)

---

## Arhitectură

```
┌──────────────┐   MQTT    ┌──────────────┐   SQL    ┌──────────────┐
│ Dispozitive  │ ────────► │   Backend    │ ───────► │  PostgreSQL  │
│ IoT / Senzori│  iot/.../ │    Flask     │          │              │
│ (Raspberry)  │ telemetry │  + MQTT sub  │          └──────────────┘
└──────────────┘           │  + WebSocket │
                           └──────┬───────┘
                                  │ REST API + WebSocket (timp real)
                                  ▼
                           ┌──────────────┐
                           │   Frontend   │
                           │    React     │
                           └──────────────┘
```

- Dispozitivele **publică** date pe broker-ul MQTT (topic `iot/<cod>/telemetry`).
- Backend-ul Flask este **abonat** la broker, salvează datele în PostgreSQL,
  verifică pragurile și generează alerte.
- Actualizările sunt transmise instant în interfață prin **WebSocket (SocketIO)**.

---

## Cerințe

- **Python** 3.10+
- **Node.js** 18+ și npm
- **PostgreSQL** 14+
- **Broker MQTT** (Mosquitto)

> Cel mai simplu mod de a rula PostgreSQL și Mosquitto este prin **Docker**
> (vezi pasul 1). Dacă nu ai Docker, instalează-le nativ (instrucțiuni mai jos).

---

## Instalare rapidă

```bash
# 1. Pornește infrastructura (PostgreSQL + Mosquitto)
docker compose up -d

# 2. Backend
cd backend
python -m venv .venv
# Windows:  .venv\Scripts\activate
# Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env        # Windows  (Linux/Mac: cp .env.example .env)
python seed.py                # populează date demo
python run.py                 # pornește serverul pe http://localhost:5000

# 3. Frontend (într-un terminal nou)
cd frontend
npm install
npm run dev                   # http://localhost:5173

# 4. Simulator (terminal nou, opțional - generează date)
cd simulator
pip install -r requirements.txt
python simulator.py
```

Deschide **http://localhost:5173** și conectează-te cu `admin` / `admin123`.

---

## 1. Servicii de infrastructură

### Varianta A — Docker (recomandat)

```bash
docker compose up -d      # pornește PostgreSQL (5432) + Mosquitto (1883)
docker compose ps         # verifică starea
docker compose down       # oprește serviciile
```

### Varianta B — Instalare nativă (fără Docker)

**PostgreSQL:** instalează de la [postgresql.org](https://www.postgresql.org/download/),
apoi creează baza de date și utilizatorul:

```sql
CREATE USER iot_user WITH PASSWORD 'iot_parola';
CREATE DATABASE iot_platforma OWNER iot_user;
```

**Mosquitto:**
- Windows: descarcă de la [mosquitto.org/download](https://mosquitto.org/download/).
- Raspberry Pi / Linux: `sudo apt install mosquitto mosquitto-clients`

Pornește Mosquitto cu configurația din `mosquitto/config/mosquitto.conf` sau cu
`allow_anonymous true` pentru rețeaua locală.

---

## 2. Backend (Flask)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp .env.example .env            # apoi editează .env dacă e nevoie
python seed.py                  # creează conturi + dispozitive demo
python run.py
```

Serverul rulează pe **http://localhost:5000**. Verifică: `GET /api/sanatate`.

Variabilele importante din `.env`:

| Variabilă | Descriere |
|-----------|-----------|
| `DATABASE_URL` | Conexiunea PostgreSQL |
| `MQTT_BROKER_HOST` / `MQTT_BROKER_PORT` | Adresa broker-ului MQTT |
| `JWT_SECRET_KEY` | Cheie secretă pentru token-uri (schimb-o în producție!) |
| `DEVICE_OFFLINE_TIMEOUT` | Secunde după care un dispozitiv devine offline |

---

## 3. Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Aplicația pornește pe **http://localhost:5173**. În dezvoltare, cererile `/api`
și `/socket.io` sunt redirecționate automat către backend (vezi `vite.config.js`).

Pentru build de producție: `npm run build` (rezultatul în `frontend/dist`).

---

## 4. Simulator de dispozitive

Generează telemetrie realistă pentru dispozitivele demo, fără hardware fizic:

```bash
cd simulator
pip install -r requirements.txt
python simulator.py                         # broker local, interval 5s
python simulator.py --broker 192.168.1.10 --interval 2
```

> Rulează `python seed.py` în backend **înainte** de simulator, ca dispozitivele
> demo să existe în platformă.

---

## Conturi demo

| Rol | Utilizator | Parolă |
|-----|------------|--------|
| Administrator | `admin` | `admin123` |
| Utilizator | `demo` | `demo123` |

> Primul cont înregistrat prin interfață devine automat **administrator**.

---

## Conectarea dispozitivelor reale

Dispozitivele publică date JSON pe broker-ul MQTT:

| Topic | Exemplu payload |
|-------|-----------------|
| `iot/<cod_dispozitiv>/telemetry` | `{"temperatura": 23.5, "umiditate": 60}` |
| `iot/<cod_dispozitiv>/status` | `online` sau `offline` |

Exemplu pe Raspberry Pi (Python):

```python
import json, time
import paho.mqtt.client as mqtt

client = mqtt.Client()
client.connect("IP_SERVER_PLATFORMA", 1883, 60)

while True:
    date = {"temperatura": 23.5, "umiditate": 58}
    client.publish("iot/<cod_dispozitiv>/telemetry", json.dumps(date))
    time.sleep(5)
```

> Adaugă mai întâi dispozitivul în interfață (meniul **Dispozitive**), folosind
> exact același `cod_dispozitiv` ca în topic.

---

## Structura proiectului

```
proiect/
├── backend/                # API Flask + MQTT + WebSocket
│   ├── app/
│   │   ├── api/            # rute REST (auth, dispozitive, alerte, dashboard)
│   │   ├── models/        # modele SQLAlchemy
│   │   ├── mqtt/          # client MQTT (subscriber)
│   │   ├── services/      # logica de telemetrie și alerte
│   │   ├── config.py
│   │   └── extensions.py
│   ├── run.py             # punct de intrare
│   ├── seed.py            # date demo
│   └── requirements.txt
├── frontend/               # interfață React
│   └── src/
│       ├── pages/         # Login, Dashboard, Dispozitive, Alerte, Setări...
│       ├── components/    # componente reutilizabile
│       ├── context/       # AuthContext, NotificationsContext
│       └── api/           # client axios + socket.io
├── simulator/              # simulator dispozitive IoT
├── mosquitto/              # configurație broker MQTT
└── docker-compose.yml      # PostgreSQL + Mosquitto
```

---

## Deployment pe Raspberry Pi 5

1. Instalează Docker: `curl -fsSL https://get.docker.com | sh`
2. Pornește infrastructura: `docker compose up -d`
3. Rulează backend-ul cu un server de producție (ex. `gunicorn` cu worker eventlet,
   sau direct `python run.py` pentru rețea locală).
4. Construiește frontend-ul (`npm run build`) și servește `dist/` cu Nginx sau
   setează `VITE_API_URL` către adresa backend-ului.
5. Asigură-te că portul `1883` (MQTT) este accesibil dispozitivelor din rețea.

> Pe modelul de 2 GB RAM, platforma rulează confortabil pentru zeci de dispozitive.
> Pentru volume mari de telemetrie, ia în calcul curățarea periodică a tabelului
> `telemetrie` sau o politică de retenție.

---

## Funcționalități

- Autentificare și înregistrare securizată (JWT)
- Gestionare dispozitive (adăugare, editare, ștergere)
- Telemetrie în timp real cu grafice interactive
- Praguri de alertare configurabile per metrică
- Alerte automate (depășire prag, dispozitiv offline)
- Notificări live prin WebSocket
- Panou de control cu statistici și distribuție pe tipuri
- Trimitere comenzi către dispozitive prin MQTT
- Interfață responsivă, complet în limba română
```
