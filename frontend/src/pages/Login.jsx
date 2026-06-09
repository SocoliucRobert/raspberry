import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, LogIn, AlertCircle, Cpu, BarChart3, Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { autentificare } = useAuth()
  const navigate = useNavigate()
  const [identificator, setIdentificator] = useState('')
  const [parola, setParola] = useState('')
  const [eroare, setEroare] = useState('')
  const [seTrimite, setSeTrimite] = useState(false)

  const trimite = async (e) => {
    e.preventDefault()
    setEroare('')
    setSeTrimite(true)
    try {
      await autentificare(identificator, parola)
      navigate('/')
    } catch (err) {
      setEroare(err?.response?.data?.eroare || 'Autentificare eșuată. Încearcă din nou.')
    } finally {
      setSeTrimite(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Panou stânga - branding */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
            <Activity className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold">Platformă IoT</span>
        </div>

        <div className="max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            Gestionează și monitorizează dispozitivele IoT dintr-un singur loc
          </h1>
          <p className="mt-4 text-brand-100">
            Soluție cloud pentru Raspberry Pi 5 — telemetrie în timp real, alerte
            inteligente și control complet al senzorilor.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { icon: Cpu, text: 'Conectează nelimitat dispozitive prin MQTT' },
              { icon: BarChart3, text: 'Vizualizează datele senzorilor în timp real' },
              { icon: Bell, text: 'Primește alerte la depășirea pragurilor' },
            ].map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-brand-50">{f.text}</span>
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-sm text-brand-200">© {new Date().getFullYear()} Platformă IoT</p>
      </div>

      {/* Panou dreapta - formular */}
      <div className="flex w-full items-center justify-center bg-slate-50 p-6 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Activity className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Platformă IoT</h2>
          </div>

          <h2 className="text-2xl font-bold text-slate-800">Bine ai revenit!</h2>
          <p className="mt-1 text-sm text-slate-500">
            Conectează-te pentru a accesa panoul de control.
          </p>

          {eroare && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {eroare}
            </div>
          )}

          <form onSubmit={trimite} className="mt-6 space-y-4">
            <div>
              <label className="label">Nume utilizator sau email</label>
              <input
                className="input"
                value={identificator}
                onChange={(e) => setIdentificator(e.target.value)}
                placeholder="ex: admin"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="label">Parolă</label>
              <input
                type="password"
                className="input"
                value={parola}
                onChange={(e) => setParola(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={seTrimite}>
              <LogIn className="h-4 w-4" />
              {seTrimite ? 'Se conectează...' : 'Conectare'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Nu ai cont?{' '}
            <Link to="/inregistrare" className="font-semibold text-brand-600 hover:text-brand-700">
              Creează unul acum
            </Link>
          </p>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-3 text-center text-xs text-slate-500">
            Cont demo: <span className="font-semibold text-slate-700">admin</span> / parolă{' '}
            <span className="font-semibold text-slate-700">admin123</span>
          </div>
        </div>
      </div>
    </div>
  )
}
