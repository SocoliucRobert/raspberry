import { useState, useEffect } from 'react'
import {
  User,
  Mail,
  Shield,
  Radio,
  Moon,
  Sun,
  Bell,
  Volume2,
  VolumeX,
  Clock,
  Thermometer,
  Droplets,
  Activity,
  Save,
  Cpu,
  Server,
  Database,
  Check,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function Toggle({ activ, onChange, eticheta, descriere, iconActive: IconA, iconInactiv: IconI }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
          {activ ? (
            <IconA className="h-4 w-4 text-brand-500" />
          ) : (
            <IconI className="h-4 w-4 text-slate-400" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{eticheta}</p>
          {descriere && <p className="text-xs text-slate-400">{descriere}</p>}
        </div>
      </div>
      <button
        onClick={() => onChange(!activ)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          activ ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            activ ? 'left-5' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}

function InputPrag({ label, value, onChange, unitate }) {
  return (
    <div>
      <label className="label text-xs">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step="0.1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input w-24 text-sm"
        />
        <span className="text-xs text-slate-400">{unitate}</span>
      </div>
    </div>
  )
}

export default function Settings() {
  const { utilizator } = useAuth()

  // ---------- Dark mode ----------
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [dark])

  // ---------- Notificări ----------
  const [notificari, setNotificari] = useState(() => localStorage.getItem('notificari') !== 'false')
  const [sunet, setSunet] = useState(() => localStorage.getItem('sunet_alerte') === 'true')
  useEffect(() => localStorage.setItem('notificari', notificari), [notificari])
  useEffect(() => localStorage.setItem('sunet_alerte', sunet), [sunet])

  // ---------- Praguri implicite ----------
  const [timeoutOffline, setTimeoutOffline] = useState(() => parseInt(localStorage.getItem('timeout_offline') || '300'))
  const [tempMin, setTempMin] = useState(() => localStorage.getItem('prag_temp_min') || '16')
  const [tempMax, setTempMax] = useState(() => localStorage.getItem('prag_temp_max') || '27')
  const [umidMin, setUmidMin] = useState(() => localStorage.getItem('prag_umid_min') || '30')
  const [umidMax, setUmidMax] = useState(() => localStorage.getItem('prag_umid_max') || '65')

  const [salvat, setSalvat] = useState(false)

  const salveazaPraguri = () => {
    localStorage.setItem('timeout_offline', timeoutOffline)
    localStorage.setItem('prag_temp_min', tempMin)
    localStorage.setItem('prag_temp_max', tempMax)
    localStorage.setItem('prag_umid_min', umidMin)
    localStorage.setItem('prag_umid_max', umidMax)
    setSalvat(true)
    setTimeout(() => setSalvat(false), 2000)
  }

  return (
    <div className="max-w-4xl space-y-5">
      {/* ---------- Profil ---------- */}
      <div className="card p-5">
        <h2 className="mb-4 font-semibold text-slate-800 dark:text-slate-100">Profilul meu</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-700/50">
            <User className="h-5 w-5 text-slate-400" />
            <div className="min-w-0">
              <p className="text-xs text-slate-400">Nume utilizator</p>
              <p className="truncate font-medium text-slate-800 dark:text-slate-200">
                {utilizator?.nume_utilizator}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-700/50">
            <Mail className="h-5 w-5 text-slate-400" />
            <div className="min-w-0">
              <p className="text-xs text-slate-400">Email</p>
              <p className="truncate font-medium text-slate-800 dark:text-slate-200">{utilizator?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-700/50">
            <Shield className="h-5 w-5 text-slate-400" />
            <div className="min-w-0">
              <p className="text-xs text-slate-400">Rol</p>
              <p className="truncate font-medium capitalize text-slate-800 dark:text-slate-200">
                {utilizator?.rol}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Aspect ---------- */}
      <div className="card p-5">
        <h2 className="mb-4 font-semibold text-slate-800 dark:text-slate-100">Aspect</h2>
        <Toggle
          activ={dark}
          onChange={setDark}
          eticheta="Mod întunecat"
          descriere="Comută între tema deschisă și cea închisă"
          iconActive={Moon}
          iconInactiv={Sun}
        />
      </div>

      {/* ---------- Notificări ---------- */}
      <div className="card p-5">
        <h2 className="mb-4 font-semibold text-slate-800 dark:text-slate-100">Notificări</h2>
        <div className="space-y-1">
          <Toggle
            activ={notificari}
            onChange={setNotificari}
            eticheta="Alerte în timp real"
            descriere="Afișează notificări pentru alerte noi"
            iconActive={Bell}
            iconInactiv={Bell}
          />
          <Toggle
            activ={sunet}
            onChange={setSunet}
            eticheta="Sunet la alerte"
            descriere="Redă un sunet când apare o alertă critică"
            iconActive={Volume2}
            iconInactiv={VolumeX}
          />
        </div>
      </div>

      {/* ---------- Praguri implicite ---------- */}
      <div className="card p-5">
        <h2 className="mb-1 flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
          <Activity className="h-5 w-5 text-brand-500" /> Praguri implicite
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Valori implicite pentru pragurile de alertare la adăugarea unui dispozitiv nou.
        </p>

        <div className="space-y-4">
          <div>
            <label className="label text-xs">Timeout dispozitiv offline</label>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-slate-400" />
              <input
                type="range"
                min="60"
                max="1800"
                step="60"
                value={timeoutOffline}
                onChange={(e) => setTimeoutOffline(Number(e.target.value))}
                className="w-48 accent-brand-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {Math.round(timeoutOffline / 60)} min
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <InputPrag
              label="Temp. minimă"
              value={tempMin}
              onChange={setTempMin}
              unitate="°C"
            />
            <InputPrag
              label="Temp. maximă"
              value={tempMax}
              onChange={setTempMax}
              unitate="°C"
            />
            <InputPrag
              label="Umid. minimă"
              value={umidMin}
              onChange={setUmidMin}
              unitate="%"
            />
            <InputPrag
              label="Umid. maximă"
              value={umidMax}
              onChange={setUmidMax}
              unitate="%"
            />
          </div>

          <button onClick={salveazaPraguri} className="btn-primary mt-2">
            {salvat ? (
              <>
                <Check className="h-4 w-4" /> Salvat
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Salvează praguri
              </>
            )}
          </button>
        </div>
      </div>

      {/* ---------- Ghid MQTT ---------- */}
      <div className="card p-5">
        <h2 className="mb-1 flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
          <Radio className="h-5 w-5 text-brand-500" /> Conectarea dispozitivelor prin MQTT
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Dispozitivele tale publică date pe brokerul MQTT al platformei folosind topicele de mai jos.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Topic telemetrie
            </p>
            <code className="mt-1 block text-sm text-slate-800 dark:text-slate-200">
              iot/&lt;cod_dispozitiv&gt;/telemetry
            </code>
            <p className="mt-2 text-xs text-slate-500">
              Payload JSON: <code>{`{"temperatura": 23.5}`}</code>
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Topic stare
            </p>
            <code className="mt-1 block text-sm text-slate-800 dark:text-slate-200">
              iot/&lt;cod_dispozitiv&gt;/status
            </code>
            <p className="mt-2 text-xs text-slate-500">
              Valoare: <code>online</code> sau <code>offline</code>
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-3 dark:border-brand-900 dark:bg-brand-900/20">
          <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
            Pentru Raspberry Pi 5 există un client gata configurat în folderul
            <code className="mx-1 rounded bg-white px-1 py-0.5 text-xs dark:bg-slate-800">raspberry-pi-client/</code>.
            Vezi README-ul din acel folder pentru pașii de instalare.
          </p>
        </div>
      </div>

      {/* ---------- Despre ---------- */}
      <div className="card p-5">
        <h2 className="mb-4 font-semibold text-slate-800 dark:text-slate-100">Despre platformă</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-700/50">
            <Cpu className="h-5 w-5 text-brand-500" />
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Frontend</p>
              <p className="text-xs text-slate-400">React + Vite + Tailwind</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-700/50">
            <Server className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Backend</p>
              <p className="text-xs text-slate-400">Flask + MQTT + SocketIO</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-700/50">
            <Database className="h-5 w-5 text-violet-500" />
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Bază de date</p>
              <p className="text-xs text-slate-400">PostgreSQL</p>
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">
          Platformă IoT v1.0.0 · Optimizată pentru Raspberry Pi 5
        </p>
      </div>
    </div>
  )
}
