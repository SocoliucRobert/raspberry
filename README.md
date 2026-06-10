r# Platformă Cloud pentru Gestionarea și Monitorizarea Dispozitivelor IoT

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
- **PostgreSQL** 14+ (instalat nativ)
- **Broker MQTT** (Mosquitto instalat nativ pe Windows)

> **Windows:** Se folosește Mosquitto nativ (nu Docker) pentru acces din rețeaua locală.
> **Linux/Mac:** Poți folosi Docker (vezi Varianta A) sau instalare nativă.

---

## Instalare rapidă (Windows)

### 1. PostgreSQL (instalat nativ)

Instalează PostgreSQL de la [postgresql.org/download](https://www.postgresql.org/download/windows/),
apoi creează baza de date:

```sql
CREATE USER iot_user WITH PASSWORD 'iot_parola';
CREATE DATABASE iot_platforma OWNER iot_user;
```

### 2. Mosquitto (instalat nativ pe Windows)

```powershell
# Instalează Mosquitto
winget install --id EclipseFoundation.Mosquitto

# Oprește serviciul implicit (rulează cu config-ul proiectului mai târziu)
# Sau configurează manual C:\Program Files\mosquitto\mosquitto.conf să asculte pe 0.0.0.0
```

**IMPORTANT:** Deschide `C:\Program Files\mosquitto\mosquitto.conf` și adaugă la început:

```ini
listener 1883 0.0.0.0
allow_anonymous true
```

Apoi restart-ează serviciul din `services.msc` sau rulează manual:

```powershell
& "C:\Program Files\mosquitto\mosquitto.exe" -c "D:\proiect\mosquitto\config\mosquitto.conf"
```

### 3. Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env        # editează .env dacă e nevoie
python seed.py                # creează conturile admin + demo
python run.py                 # http://localhost:5000
```

### 4. Frontend

```powershell
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

Deschide **http://localhost:5173** și conectează-te cu `admin` / `admin123`.

---

## 1. Servicii de infrastructură

### Varianta A — Windows nativ (recomandat pentru dezvoltare locală)

**PostgreSQL:**
1. Instalează de la [postgresql.org/download](https://www.postgresql.org/download/windows/)
2. Setează parola `postgres` la instalare
3. Creează utilizatorul și baza de date:

```sql
CREATE USER iot_user WITH PASSWORD 'iot_parola';
CREATE DATABASE iot_platforma OWNER iot_user;
```

**Mosquitto:**
1. Instalează: `winget install --id EclipseFoundation.Mosquitto`
2. Configurează `C:\Program Files\mosquitto\mosquitto.conf`:

```ini
listener 1883 0.0.0.0
allow_anonymous true
```

3. Deschide portul 1883 în firewall (PowerShell admin):

```powershell
New-NetFirewallRule -DisplayName "Mosquitto MQTT 1883" -Direction Inbound -LocalPort 1883 -Protocol TCP -Action Allow -Profile Private
```

4. Restart serviciu din `services.msc` sau rulează manual:

```powershell
& "C:\Program Files\mosquitto\mosquitto.exe" -c "D:\proiect\mosquitto\config\mosquitto.conf"
```

### Varianta B — Docker (Linux / Mac)

```bash
docker compose up -d      # pornește PostgreSQL (5432) + Mosquitto (1883)
docker compose ps         # verifică starea
docker compose down       # oprește serviciile
```

> **Notă:** Pe Windows, Docker Desktop poate bloca accesul la portul 1883 din rețeaua locală.
> Se recomandă instalarea nativă a Mosquitto.

---

## 2. Backend (Flask)

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
copy .env.example .env          # editează .env dacă e nevoie
python seed.py                  # creează conturile admin și demo
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

## 4. Simulator de dispozitive (opțional, pentru testare)

Generează telemetrie pentru dispozitivele adăugate manual în platformă.
Editează `simulator.py` și adaugă codurile dispozitivelor tale în lista `DISPOZITIVE`.

```bash
cd simulator
pip install -r requirements.txt
python simulator.py
```

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

### Raspberry Pi 5 — client dedicat

#### Pasul 1: Adaugă dispozitivul în platformă

În interfața web (`http://localhost:5173`):
1. Mergi la **Dispozitive** → **Adaugă dispozitiv**
2. Completează:
   - **Cod dispozitiv**: `rpi5-roby` (sau ce alegi)
   - **Tip**: `monitorizare`
   - **Nume**: `Raspberry Pi 5 - Roby`
3. Apasă **Salvează**

#### Pasul 2: Copiază clientul pe Raspberry Pi

De pe PC (PowerShell):

```powershell
scp -r D:\proiect\raspberry-pi-client\ roby@192.168.1.176:~/
```

#### Pasul 3: Configurează și rulează pe Pi

```bash
ssh roby@192.168.1.176
# parola: parola

cd ~/raspberry-pi-client
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
nano .env
```

Editează `.env`:

```ini
BROKER_MQTT=192.168.1.192    # IP-ul PC-ului (NU al Pi-ului!)
COD_DISPOZITIV=rpi5-roby     # același cod ca în platformă
INTERVAL=10
```

Salvează (`Ctrl+O`, `Enter`, `Ctrl+X`) și rulează:

```bash
python client.py
```

Ar trebui să vezi:

```
[MQTT] Conectat la 192.168.1.192:1883
[MQTT] Status: online -> iot/rpi5-roby/status
[11:30:15] {"timestamp": "...", "temperatura_cpu": 42.3, "utilizare_cpu": 12.5, ...}
```

#### Depanare

| Problemă | Soluție |
|----------|---------|
| `[Errno 111] Connection refused` | Verifică că Mosquitto rulează pe PC și că portul 1883 e deschis în firewall |
| `temperatura_cpu` lipsește | Normal pe Windows; pe Raspberry Pi funcționează corect |
| Dispozitiv offline în platformă | Verifică log-urile clientului și că codul dispozitivului e identic în `.env` și platformă |

Detalii complete (inclusiv configurare systemd pentru pornire automată) în `raspberry-pi-client/README.md`.

### Exemplu generic (Python)

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
├── raspberry-pi-client/    # client MQTT pentru Raspberry Pi 5
├── simulator/              # simulator dispozitive IoT (testare fără hardware)
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
- Conectare dispozitive reale (Raspberry Pi 5, ESP32, senzori) prin MQTT
- Interfață responsivă, complet în limba română
```
