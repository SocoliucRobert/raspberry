import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Activity, LogIn, AlertCircle, Cpu, BarChart3, Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function GoogleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

export default function Login() {
  const { autentificare, loginCuToken } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [identificator, setIdentificator] = useState('')
  const [parola, setParola] = useState('')
  const [eroare, setEroare] = useState('')
  const [seTrimite, setSeTrimite] = useState(false)
  const [seProceseazaGoogle, setSeProceseazaGoogle] = useState(false)

  // Procesează token-ul din URL (redirect de la Google OAuth)
  useEffect(() => {
    const token = searchParams.get('token')
    const err = searchParams.get('error')

    if (err) {
      setEroare(
        err === 'google_access_denied'
          ? 'Autentificarea Google a fost anulată.'
          : 'Eroare la autentificarea cu Google. Încearcă din nou.'
      )
      // Curăță URL-ul de parametri
      window.history.replaceState({}, document.title, window.location.pathname)
      return
    }

    if (token) {
      setSeProceseazaGoogle(true)
      loginCuToken(token)
        .then(() => navigate('/'))
        .catch(() => {
          setEroare('Token-ul primit de la Google este invalid.')
          setSeProceseazaGoogle(false)
        })
        .finally(() => {
          window.history.replaceState({}, document.title, window.location.pathname)
        })
    }
  }, [searchParams, loginCuToken, navigate])

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

  const loginGoogle = () => {
    window.location.href = '/api/auth/google'
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
      <div className="flex w-full items-center justify-center bg-slate-50 p-6 dark:bg-slate-900 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Activity className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Platformă IoT</h2>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Bine ai revenit!</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Conectează-te pentru a accesa panoul de control.
          </p>

          {eroare && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {eroare}
            </div>
          )}

          {seProceseazaGoogle && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700 dark:border-brand-900 dark:bg-brand-900/20 dark:text-brand-300">
              <Activity className="h-4 w-4 animate-spin" />
              Se finalizează autentificarea cu Google...
            </div>
          )}

          {/* Google OAuth */}
          <button
            onClick={loginGoogle}
            disabled={seProceseazaGoogle}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <GoogleIcon className="h-5 w-5" />
            Conectare cu Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-50 px-2 text-slate-400 dark:bg-slate-900">sau</span>
            </div>
          </div>

          <form onSubmit={trimite} className="space-y-4">
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

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Nu ai cont?{' '}
            <Link to="/inregistrare" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
              Creează unul acum
            </Link>
          </p>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-3 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800">
            Cont demo: <span className="font-semibold text-slate-700 dark:text-slate-300">admin</span> / parolă{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">admin123</span>
          </div>
        </div>
      </div>
    </div>
  )
}
