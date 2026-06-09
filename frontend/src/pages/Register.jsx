import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, UserPlus, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { inregistrare } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nume_utilizator: '', email: '', parola: '', confirmare: '' })
  const [eroare, setEroare] = useState('')
  const [seTrimite, setSeTrimite] = useState(false)

  const modifica = (camp) => (e) => setForm({ ...form, [camp]: e.target.value })

  const trimite = async (e) => {
    e.preventDefault()
    setEroare('')
    if (form.parola !== form.confirmare) {
      setEroare('Parolele nu coincid.')
      return
    }
    if (form.parola.length < 6) {
      setEroare('Parola trebuie să aibă cel puțin 6 caractere.')
      return
    }
    setSeTrimite(true)
    try {
      await inregistrare({
        nume_utilizator: form.nume_utilizator,
        email: form.email,
        parola: form.parola,
      })
      navigate('/')
    } catch (err) {
      setEroare(err?.response?.data?.eroare || 'Înregistrare eșuată. Încearcă din nou.')
    } finally {
      setSeTrimite(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Activity className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Creează un cont</h2>
          <p className="mt-1 text-sm text-slate-500">
            Înregistrează-te pentru a gestiona dispozitivele tale IoT.
          </p>
        </div>

        <div className="card p-6">
          {eroare && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {eroare}
            </div>
          )}

          <form onSubmit={trimite} className="space-y-4">
            <div>
              <label className="label">Nume utilizator</label>
              <input
                className="input"
                value={form.nume_utilizator}
                onChange={modifica('nume_utilizator')}
                placeholder="ex: ion.popescu"
                minLength={3}
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={modifica('email')}
                placeholder="ex: ion@exemplu.ro"
                required
              />
            </div>
            <div>
              <label className="label">Parolă</label>
              <input
                type="password"
                className="input"
                value={form.parola}
                onChange={modifica('parola')}
                placeholder="Minim 6 caractere"
                minLength={6}
                required
              />
            </div>
            <div>
              <label className="label">Confirmă parola</label>
              <input
                type="password"
                className="input"
                value={form.confirmare}
                onChange={modifica('confirmare')}
                placeholder="Reintrodu parola"
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={seTrimite}>
              <UserPlus className="h-4 w-4" />
              {seTrimite ? 'Se creează contul...' : 'Înregistrare'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Ai deja cont?{' '}
          <Link to="/autentificare" className="font-semibold text-brand-600 hover:text-brand-700">
            Conectează-te
          </Link>
        </p>
      </div>
    </div>
  )
}
