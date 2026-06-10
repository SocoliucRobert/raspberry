# Platformă IoT pentru Raspberry Pi 5 — Descriere Completă

## 1. Context și motivație
Aplicația a fost dezvoltată în cadrul Universității „Ștefan cel Mare" din Suceava (USU) ca proiect de licență / cercetare în domeniul IoT (Internet of Things). Scopul este să ofere o soluție cloud completă pentru monitorizarea și gestionarea dispozitivelor IoT bazate pe Raspberry Pi 5, cu accent pe telemetrie în timp real, alerte inteligente și control centralizat.

## 2. Arhitectură generală
Arhitectura este modulară și separată în trei componente principale:

```
┌──────────────────┐      REST/WebSocket     ┌──────────────────┐
│   Frontend       │ ◄─────────────────────► │    Backend       │
│   (React + Vite) │                         │   (Flask + SQL)  │
└──────────────────┘                         └────────┬─────────┘
         ▲                                            │ MQTT
         │                                            ▼
   ╔═══════════╗                             ┌──────────────────┐
   ║  Browser  ║                             │  Broker MQTT     │
   ║  (utiliz.)║                             │  (Mosquitto)   │
   ╚═══════════╝                             └────────┬─────────┘
                                                      │
                              ┌─────────────────────┼──────────────┐
                              ▼                     ▼              ▼
                       ┌─────────────┐      ┌──────────────┐  ┌─────────────┐
                       │ Raspberry Pi│      │Raspberry Pi  │  │ Simulator   │
                       │   5 (Lab)   │      │ 5 (Server)   │  │  (Python)   │
                       └─────────────┘      └──────────────┘  └─────────────┘
```

### 2.1 Backend (Flask)
- **Framework:** Flask 3.0.3 cu Flask-SQLAlchemy, Flask-JWT-Extended, Flask-CORS, Flask-SocketIO
- **Bază de date:** PostgreSQL (producție) / SQLite (opțional, teste)
- **Autentificare:** JWT (JSON Web Tokens) cu expirare 12 ore + Google OAuth 2.0
- **Comunicare în timp real:** WebSocket prin Flask-SocketIO pentru update-uri live
- **Broker MQTT:** Integrare cu Paho-MQTT pentru primirea telemetriei de la dispozitive
- **Deployment:** server de dezvoltare Werkzeug (pentru testare locală)

### 2.2 Frontend (React)
- **Framework:** React 18 cu Vite (build rapid)
- **Styling:** Tailwind CSS 3.4 cu design system custom (paletă USU)
- **Rutare:** React Router DOM
- **Grafice:** Recharts pentru vizualizări (PieChart, LineChart, BarChart)
- **Iconițe:** Lucide React
- **Conectivitate:** Axios pentru REST API + Socket.IO client pentru timp real

### 2.3 Client Raspberry Pi 5
- **Limbaj:** Python 3
- **Bibliotecă MQTT:** paho-mqtt
- **Senzori suportați:** temperatură (DHT22/BMP280), calitate aer (MQ-135), metrici sistem (CPU, RAM)
- **Configurare:** prin fișier `.env`

## 3. Funcționalități principale

### 3.1 Autentificare și securitate
- **Înregistrare / Login clasic:** cu nume utilizator, email și parolă (hash bcrypt)
- **Login cu Google OAuth 2.0:** buton „Conectare cu Google" pe pagina de autentificare
  - Creează cont nou automat dacă email-ul nu există
  - Leagă cont existent dacă email-ul e deja înregistrat
  - Salvează `google_id`, `avatar_url` (foto de profil Google)
- **JWT:** token de acces cu expirare 12 ore, stocat în localStorage
- **Roluri:** `admin` și `utilizator` (diferențe de acces în UI)
- **CORS:** configurat pentru frontend local (`localhost:5173`)

### 3.2 Gestionare dispozitive
- **Adăugare dispozitiv:** formular cu nume, cod unic MQTT, tip, locație, descriere, praguri de alertă
- **Editare / Ștergere:** doar pentru proprietar sau admin
- **Status live:** online / offline bazat pe timestamp-ul ultimei telemetrii
- **Cod dispozitiv:** identificator unic folosit în topicele MQTT (`iot/{cod}/telemetrie`, `iot/{cod}/stare`)
- **Praguri configurabile:** pe metrică (min/max), ex: temperatura 18-28 °C
- **Telemetrie istorică:** ultima valoare per metrică afișată pe cardul dispozitivului

### 3.3 Telemetrie în timp real
- **Primire:** backend ascultă topicul MQTT `iot/+/telemetrie` și salvează în PostgreSQL
- **Distribuție:** datele sosite sunt emise instant prin WebSocket (`telemetrie`) către toți clienții conectați
- **Vizualizare:**
  - Carduri pe Dashboard cu valori curente
  - Pagină de detalii per dispozitiv cu grafice istorice (LineChart) pentru fiecare metrică
  - Tabel cu ultimele 50 de înregistrări
- **Metrici suportate:** temperatură, umiditate, presiune, calitate aer (AQI), temperatură CPU, load CPU, utilizare RAM

### 3.4 Alerte și notificări
- **Generare automată:**
  - Prag depășit: când o valoare iese din intervalul configurat
  - Dispozitiv offline: când nu mai primește date pentru 90 de secunde
  - Dispozitiv online revenit: notificare la reconectare
- **Severități:** `info`, `avertisment`, `critic`
- **Notificări în UI:** badge pe iconița de clopoțel în Topbar + număr pe Sidebar
- **WebSocket:** alertele noi sosesc live (`alerta` event)
- **Management:** marchează ca citită, marchează toate ca citite, șterge
- **Filtre:** necitite / toate; filtrare pe severitate

### 3.5 Dashboard
- **Carduri statistice:** Total dispozitive, Online, Offline, Alerte necitite
- **Alerte recente:** lista ultimelor 6 alerte cu severitate și timp
- **Distribuție:** PieChart cu dispozitivele grupate pe tip (senzor, server etc.)
- **Dispozitive:** preview cu primele 6 carduri, link „Vezi toate"
- **Animații:** `floatUp` la încărcare

### 3.6 Design UI / UX
- **Branding USU:** sigla oficială a Universității „Ștefan cel Mare" Suceava în Sidebar, Login, Register și favicon
- **Paleta de culori:** albastru universitate (`#1f4a8f`, `#8ec5e8`) inspirată din siglă
- **Gradienturi:** fundal radial subtil, sidebar gradient, butoane gradient
- **Carduri:** cu umbră subtilă, bară laterală colorată (StatCard), hover ridicat
- **Dark mode:** comutabil din Setări, persistat în localStorage, aplicat global pe toate paginile
- **Responsive:** Sidebar colapsabil pe mobil, layouturi adaptive
- **Scrollbar personalizat:** culori adaptate light/dark

### 3.7 Setări
- **Dark mode toggle:** comutare instant între light și dark
- **Setări notificări:** activare/dezactivare notificări alerte, prag implicit
- **Setări praguri alerte:** valori implicite min/max pentru noile dispozitive
- **Ghid MQTT:** instrucțiuni pentru conectarea unui Raspberry Pi 5 real

### 3.8 Demo data (seed)
- **Script:** `backend/seed_demo.py`
- **3 dispozitive** pre-populate cu telemetrie istorică și alerte
- **Idempotent:** rulează de multiple ori fără duplicate (verifică cod_dispozitiv)
- **Cleanup:** `--cleanup` pentru ștergere

## 4. Tehnologii și dependințe

### Backend
| Pachet | Versiune | Rol |
|--------|----------|-----|
| Flask | 3.0.3 | Framework web |
| Flask-SQLAlchemy | 3.1.1 | ORM bază de date |
| Flask-JWT-Extended | 4.6.0 | Autentificare JWT |
| Flask-Cors | 4.0.1 | CORS |
| Flask-SocketIO | 5.3.6 | WebSocket real-time |
| python-socketio | 5.11.2 | Server Socket.IO |
| python-engineio | 4.9.1 | Engine.IO |
| simple-websocket | 1.0.0 | WebSocket simplu |
| python-dotenv | 1.0.1 | Variabile de mediu |
| psycopg2-binary | 2.9.9 | Driver PostgreSQL |
| SQLAlchemy | 2.0.30 | ORM |
| Werkzeug | 3.0.3 | WSGI utilități |
| paho-mqtt | 1.6.1 | Client MQTT |
| authlib | 1.3.0 | Google OAuth |
| requests | 2.32.0 | HTTP client |

### Frontend
| Pachet | Versiune | Rol |
|--------|----------|-----|
| react | ^18.3.1 | UI library |
| react-dom | ^18.3.1 | DOM renderer |
| react-router-dom | ^6.24.0 | Rutare |
| axios | ^1.7.2 | HTTP client |
| socket.io-client | ^4.7.5 | WebSocket client |
| recharts | ^2.12.7 | Grafice |
| lucide-react | ^0.400.0 | Iconițe |
| tailwindcss | ^3.4.4 | CSS framework |
| vite | ^5.3.3 | Build tool |

### Infrastructură
| Componentă | Rol |
|------------|-----|
| PostgreSQL | Bază de date relațională |
| Mosquitto | Broker MQTT pentru mesaje IoT |
| Docker Compose | Orchestrare servicii (opțional) |

## 5. Structura bazei de date

### `utilizatori`
| Coloană | Tip | Descriere |
|---------|-----|-----------|
| id | PK | ID utilizator |
| nume_utilizator | String | Nume afișat |
| email | String | Email (unic) |
| parola_hash | String | Hash bcrypt (nullable pentru Google) |
| rol | String | `admin` / `utilizator` |
| google_id | String | ID Google (unic, nullable) |
| avatar_url | String | URL foto profil (nullable) |
| creat_la | DateTime | Timestamp înregistrare |

### `dispozitive`
| Coloană | Tip | Descriere |
|---------|-----|-----------|
| id | PK | ID dispozitiv |
| cod_dispozitiv | String | Cod unic MQTT (ex: `rpi5-lab-01`) |
| nume | String | Denumire afișată |
| tip | String | `senzor`, `server`, etc. |
| locatie | String | Locație fizică |
| descriere | Text | Descriere detaliată |
| stare | String | `online` / `offline` |
| ultima_vazut | DateTime | Ultima telemetrie primită |
| praguri | JSON | Praguri per metrică |
| proprietar_id | FK | Utilizator proprietar |

### `telemetrie`
| Coloană | Tip | Descriere |
|---------|-----|-----------|
| id | PK | ID înregistrare |
| dispozitiv_id | FK | Dispozitiv sursă |
| metrica | String | Numele măsurătorii |
| valoare | Float | Valoarea numerică |
| unitate | String | Unitate de măsură |
| inregistrat_la | DateTime | Timestamp |

### `alerte`
| Coloană | Tip | Descriere |
|---------|-----|-----------|
| id | PK | ID alertă |
| dispozitiv_id | FK | Dispozitiv asociat |
| tip | String | `prag_depasit`, `dispozitiv_offline`, etc. |
| severitate | String | `info`, `avertisment`, `critic` |
| mesaj | Text | Mesaj pentru utilizator |
| metrica | String | Metrica implicată (nullable) |
| valoare | Float | Valoarea care a declanșat (nullable) |
| citita | Boolean | Stare citită |
| creat_la | DateTime | Timestamp |

## 6. API REST (endpoinți principali)

### Autentificare
- `POST /api/auth/inregistrare` — creează cont
- `POST /api/auth/login` — autentificare cu JWT
- `GET /api/auth/profil` — date utilizator curent
- `GET /api/auth/google` — redirect la Google OAuth
- `GET /api/auth/google/callback` — callback OAuth cu JWT

### Dispozitive
- `GET /api/dispozitive` — lista tuturor dispozitivelor
- `POST /api/dispozitive` — adaugă dispozitiv
- `GET /api/dispozitive/<id>` — detalii + metrici curente
- `PUT /api/dispozitive/<id>` — actualizează
- `DELETE /api/dispozitive/<id>` — șterge + cascade telemetrie/alerte

### Telemetrie
- `GET /api/dispozitive/<id>/telemetrie` — istoric cu paginare
- `GET /api/dispozitive/<id>/telemetrie/metrici` — metrici distincte pentru grafice

### Alerte
- `GET /api/alerte` — lista alertelor (filtre: necitite, severitate)
- `GET /api/alerte/necitite` — număr necitite (pentru badge)
- `PUT /api/alerte/<id>/citeste` — marchează citită
- `PUT /api/alerte/citeste-toate` — marchează toate ca citite
- `DELETE /api/alerte/<id>` — șterge alertă

### WebSocket Events (Socket.IO)
- `telemetrie` — nouă telemetrie primită (broadcast)
- `dispozitiv_actualizat` — schimbare stare online/offline
- `alerta` — alertă nouă generată

## 7. MQTT Topics
- `iot/{cod_dispozitiv}/telemetrie` — publicare telemetrie (JSON)
- `iot/{cod_dispozitiv}/stare` — publicare stare (`online`/`offline`)

Format telemetrie:
```json
{
  "valori": [
    {"metrica": "temperatura", "valoare": 23.5, "unitate": "°C"},
    {"metrica": "umiditate", "valoare": 45, "unitate": "%"}
  ]
}
```

## 8. Fișiere cheie în proiect

```
raspberry/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Inițializare Flask, SocketIO, MQTT
│   │   ├── api/
│   │   │   ├── auth.py          # Rute autentificare (JWT + Google OAuth)
│   │   │   ├── dispozitive.py   # CRUD dispozitive
│   │   │   ├── telemetrie.py    # Endpoint telemetrie
│   │   │   └── alerte.py        # Management alerte
│   │   ├── models/
│   │   │   ├── user.py          # Model utilizator (cu google_id, avatar)
│   │   │   ├── device.py        # Model dispozitiv
│   │   │   ├── telemetry.py     # Model telemetrie
│   │   │   └── alert.py         # Model alertă
│   │   ├── mqtt/
│   │   │   └── client.py        # Client MQTT Paho (subscribe + publish)
│   │   └── services/
│   │       └── alert_service.py # Logica generării alertelor
│   ├── .env                     # Configurare (secret, DB, MQTT, Google OAuth)
│   ├── run.py                   # Entry point server
│   ├── seed_demo.py             # Script demo data (3 dispozitive)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── main.jsx             # Entry point React + init dark mode
│   │   ├── App.jsx              # Rutare
│   │   ├── pages/
│   │   │   ├── Login.jsx        # Login + Google OAuth button
│   │   │   ├── Register.jsx     # Înregistrare
│   │   │   ├── Dashboard.jsx    # Panou de control
│   │   │   ├── Devices.jsx      # Lista dispozitive
│   │   │   ├── DeviceDetail.jsx # Detalii + grafice
│   │   │   ├── Alerts.jsx       # Management alerte
│   │   │   └── Settings.jsx     # Setări + dark mode toggle
│   │   ├── components/
│   │   │   ├── Sidebar.jsx      # Navigație cu branding USU
│   │   │   ├── Topbar.jsx       # Header cu notificări și profil
│   │   │   ├── UsuLogo.jsx      # Componenta siglă USU
│   │   │   ├── DeviceCard.jsx   # Card dispozitiv
│   │   │   ├── StatCard.jsx     # Card statistică
│   │   │   └── ...
│   │   ├── context/
│   │   │   ├── AuthContext.jsx  # Stare autentificare + loginCuToken
│   │   │   └── NotificationsContext.jsx # Badge alerte
│   │   ├── hooks/
│   │   │   └── useSocket.js     # Hook Socket.IO
│   │   └── index.css            # Stiluri Tailwind + dark mode
│   ├── public/
│   │   └── usu-logo.png         # Sigla USU oficială
│   └── tailwind.config.js       # Config Tailwind cu paleta USU
├── raspberry-pi-client/
│   ├── client.py                # Script Python pentru Raspberry Pi 5
│   └── README.md                # Instrucțiuni conectare dispozitiv real
└── mosquitto/
    └── config/mosquitto.conf    # Configurare broker MQTT
```

## 9. Autentificare cu Google OAuth (flow)
1. Utilizatorul apasă „Conectare cu Google" pe pagina de login
2. Frontend face redirect la `/api/auth/google`
3. Backend generează URL de autorizare Google cu `client_id`, `redirect_uri`, `scope=email+profile+openid`
4. Google afișează pagina de consent → utilizatorul acceptă
5. Google redirectează înapoi la `/api/auth/google/callback?code=...`
6. Backend schimbă `code` pentru `access_token` + `id_token`
7. Backend extrage email, nume, avatar din Google UserInfo API
8. Dacă utilizatorul există (după google_id sau email) → actualizează google_id și avatar
9. Dacă nu există → creează cont nou cu rol `utilizator`
10. Generează JWT și redirectează la `/autentificare?token=<jwt>`
11. Frontend extrage token-ul din URL, îl salvează în localStorage și încarcă profilul
12. Utilizatorul e autentificat — merge direct pe Dashboard

## 10. Alerte automate (triggeri)
1. **Prag depășit:** La fiecare telemetrie primită, backend verifică dacă valoarea e în afara intervalului configurat în `praguri` JSON. Dacă da, generează alertă `prag_depasit` cu severitate `avertisment` sau `critic` (după magnitudinea depășirii).
2. **Dispozitiv offline:** Task periodic (sau la verificare stare) compară `ultima_vazut` cu timpul curent. Dacă diferența > 90 secunde → alertă `dispozitiv_offline`, severitate `critic`.
3. **Dispozitiv online revenit:** Când telemetrie sosite de la un dispozitiv marcat offline → alertă `dispozitiv_online`, severitate `info`.

## 11. Securitate
- Parole hash-uite cu bcrypt (Werkzeug)
- JWT semnat cu secret lung, expirare 12 ore
- CORS configurat doar pentru originile frontend-ului
- Google OAuth cu `state` CSRF token
- Password opțional pentru utilizatorii Google (nu pot face login cu parolă dacă n-au setată)
- SQL Injection protejat prin SQLAlchemy ORM
- XSS minimizat prin React (escaping implicit)

## 12. Scalabilitate și extensibilitate
- **Modularitate:** fiecare componentă (auth, dispozitive, telemetrie, alerte) e separată în blueprint-uri
- **MQTT:** suportă orice număr de dispozitive, brokerul Mosquitto e independent
- **WebSocket:** broadcast la toți clienții conectați, scalabil prin server Socket.IO
- **Frontend:** SPA cu lazy loading posibil pe rute
- **Bază de date:** PostgreSQL suportă milioane de înregistrări de telemetrie (index pe `inregistrat_la` și `dispozitiv_id`)

## 13. Autor și context academic
- **Autor:** Socoliuc Robert
- **Universitate:** Universitatea „Ștefan cel Mare" din Suceava (USV)
- **An:** 2025-2026
- **Domeniu:** Informatică / Inginerie Software
- **Tehnologii principale:** Python, Flask, React, PostgreSQL, MQTT, IoT
