# Client Raspberry Pi 5

Client MQTT care rulează direct pe Raspberry Pi 5 și publică metrici de sistem (temperatură CPU, utilizare CPU/RAM/disk) către platforma IoT.

## Metrici publicate

| Metrică | Sursă | Unitate |
|---------|-------|---------|
| `temperatura_cpu` | `/sys/class/thermal/thermal_zone0/temp` | °C |
| `utilizare_cpu` | psutil | % |
| `memorie_ram_pct` | psutil | % |
| `memorie_ram_mb` | psutil | MB |
| `utilizare_disk_pct` | psutil | % |
| `load_avg_1m` | `os.getloadavg()` | - |

## Pași de configurare

### 1. Adaugă dispozitivul în platformă

În interfața web, mergi la **Dispozitive → Adaugă dispozitiv** și completează:

- **Cod dispozitiv**: `rpi5-roby` (sau ce alegi tu)
- **Tip**: `monitorizare`
- **Praguri** (opțional): temperatura_cpu max 75°C, utilizare_cpu max 90%

> **Important**: codul din platformă trebuie să fie **identic** cu cel din fișierul `.env` de pe Pi.

### 2. Copiază fișierele pe Raspberry Pi

De pe PC (PowerShell, din folderul proiectului):

```powershell
# Copiază folderul pe Pi (prin SSH)
scp -r raspberry-pi-client/ roby@192.168.1.176:~/
```

### 3. Instalează dependințele pe Pi

Conectează-te prin SSH și rulează:

```bash
ssh roby@192.168.1.176
cd ~/raspberry-pi-client
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 4. Configurează `.env`

```bash
cp .env.example .env
nano .env
```

Editează cel puțin:

```ini
BROKER_MQTT=192.168.1.X    # IP-ul calculatorului tău (unde rulează platforma)
COD_DISPOZITIV=rpi5-roby   # același cod ca în platformă
INTERVAL=10                # secunde între măsurători
```

> Află IP-ul PC-ului: `ipconfig` (Windows) sau `ip addr` (Linux).
> Asigură-te că PC-ul și Pi sunt în aceeași rețea.

### 5. Rulează clientul

```bash
source .venv/bin/activate
python client.py
```

Ar trebui să vezi în terminal:

```
==================================================
Client Raspberry Pi 5 - Platformă IoT
Dispozitiv: rpi5-roby
Broker:     192.168.1.X:1883
Interval:   10s
==================================================
[MQTT] Conectat la 192.168.1.X:1883
[MQTT] Status: online -> iot/rpi5-roby/status
[11:30:15] {"timestamp": "...", "temperatura_cpu": 42.3, "utilizare_cpu": 12.5, ...}
```

### 6. Verifică în platformă

Deschide `http://localhost:5173` pe PC, mergi la **Dispozitive** sau **Dashboard**. Dispozitivul `rpi5-roby` ar trebui să apară ca **online** și să afișeze grafice cu metricile de sistem.

---

## Rulare automată la pornire (systemd)

Pentru a porni clientul automat când Pi-ul bootează:

```bash
sudo nano /etc/systemd/system/iot-client.service
```

Conținut:

```ini
[Unit]
Description=IoT Platform Client - Raspberry Pi 5
After=network.target

[Service]
Type=simple
User=roby
WorkingDirectory=/home/roby/raspberry-pi-client
ExecStart=/home/roby/raspberry-pi-client/.venv/bin/python /home/roby/raspberry-pi-client/client.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Activează:

```bash
sudo systemctl daemon-reload
sudo systemctl enable iot-client.service
sudo systemctl start iot-client.service
sudo systemctl status iot-client.service
```

Vezi log-uri în timp real:

```bash
sudo journalctl -u iot-client.service -f
```

## Depanare

| Simptom | Cauză posibilă | Soluție |
|---------|----------------|---------|
| `[MQTT] Nu m-am putut conecta` | Brokerul nu e accesibil | Verifică IP-ul PC-ului, firewall, dacă Mosquitto rulează (`docker compose ps`) |
| `temperatura_cpu` lipsește | Nu rulează pe Linux/Pi | Verifică permisiunile pentru `/sys/class/thermal/...` |
| Dispozitivul apare offline | Clientul nu rulează / nu s-a conectat | Verifică log-urile clientului și brokerului |

## Extensie — senzori adiționali

Pentru a adăuga senzori fizici (BME280, DHT22, etc.), editează funcția `_citeste_metrici()` din `client.py` și adaugă citirile lor în dicționarul `metrici`.
