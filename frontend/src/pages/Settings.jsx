import { useState } from 'react'
import { User, Mail, Shield, Radio, Copy, Check, Cpu, Server, Database } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function CodeBlock({ cod }) {
  const [copiat, setCopiat] = useState(false)
  const copiaza = () => {
    navigator.clipboard?.writeText(cod).then(() => {
      setCopiat(true)
      setTimeout(() => setCopiat(false), 2000)
    })
  }
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
        <code>{cod}</code>
      </pre>
      <button
        onClick={copiaza}
        className="absolute right-2 top-2 rounded-lg bg-slate-700/80 p-1.5 text-slate-200 hover:bg-slate-600"
        title="Copiază"
      >
        {copiat ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  )
}

const EXEMPLU_PYTHON = `import json
import time
import paho.mqtt.client as mqtt

BROKER = "localhost"   # adresa serverului platformei
PORT = 1883
COD_DISPOZITIV = "<codul-tau-dispozitiv>"

client = mqtt.Client()
client.connect(BROKER, PORT, 60)

while True:
    date = {"temperatura": 23.5, "umiditate": 58}
    client.publish(f"iot/{COD_DISPOZITIV}/telemetry", json.dumps(date))
    time.sleep(5)`

export default function Settings() {
  const { utilizator } = useAuth()

  return (
    <div className="max-w-4xl space-y-5">
      {/* Profil */}
      <div className="card p-5">
        <h2 className="mb-4 font-semibold text-slate-800">Profilul meu</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
            <User className="h-5 w-5 text-slate-400" />
            <div className="min-w-0">
              <p className="text-xs text-slate-400">Nume utilizator</p>
              <p className="truncate font-medium text-slate-800">
                {utilizator?.nume_utilizator}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
            <Mail className="h-5 w-5 text-slate-400" />
            <div className="min-w-0">
              <p className="text-xs text-slate-400">Email</p>
              <p className="truncate font-medium text-slate-800">{utilizator?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
            <Shield className="h-5 w-5 text-slate-400" />
            <div className="min-w-0">
              <p className="text-xs text-slate-400">Rol</p>
              <p className="truncate font-medium capitalize text-slate-800">
                {utilizator?.rol}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ghid conectare dispozitive */}
      <div className="card p-5">
        <h2 className="mb-1 flex items-center gap-2 font-semibold text-slate-800">
          <Radio className="h-5 w-5 text-brand-500" /> Conectarea dispozitivelor prin MQTT
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Dispozitivele tale (Raspberry Pi, ESP32, senzori) publică date pe brokerul MQTT
          al platformei folosind topicele de mai jos.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Topic telemetrie
            </p>
            <code className="mt-1 block text-sm text-slate-800">
              iot/&lt;cod_dispozitiv&gt;/telemetry
            </code>
            <p className="mt-2 text-xs text-slate-500">
              Payload JSON, ex: <code>{`{"temperatura": 23.5}`}</code>
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Topic stare
            </p>
            <code className="mt-1 block text-sm text-slate-800">
              iot/&lt;cod_dispozitiv&gt;/status
            </code>
            <p className="mt-2 text-xs text-slate-500">
              Valoare: <code>online</code> sau <code>offline</code>
            </p>
          </div>
        </div>

        <div className="mb-3 mt-4 rounded-xl border border-brand-200 bg-brand-50 p-3">
          <p className="text-sm font-medium text-brand-700">
            Pentru Raspberry Pi 5 există un client gata configurat în folderul
            <code className="mx-1 rounded bg-white px-1 py-0.5 text-xs">raspberry-pi-client/</code>.
            Vezi README-ul din acel folder pentru pașii de instalare.
          </p>
        </div>

        <p className="mb-2 text-sm font-medium text-slate-700">
          Exemplu de cod generic (Python):
        </p>
        <CodeBlock cod={EXEMPLU_PYTHON} />
      </div>

      {/* Despre */}
      <div className="card p-5">
        <h2 className="mb-4 font-semibold text-slate-800">Despre platformă</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
            <Cpu className="h-5 w-5 text-brand-500" />
            <div>
              <p className="text-sm font-medium text-slate-800">Frontend</p>
              <p className="text-xs text-slate-400">React + Vite</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
            <Server className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-sm font-medium text-slate-800">Backend</p>
              <p className="text-xs text-slate-400">Flask + MQTT</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
            <Database className="h-5 w-5 text-violet-500" />
            <div>
              <p className="text-sm font-medium text-slate-800">Bază de date</p>
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
