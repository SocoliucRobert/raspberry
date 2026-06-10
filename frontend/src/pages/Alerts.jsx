import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { CheckCheck, Trash2, BellOff, AlertCircle, AlertTriangle, Info, ExternalLink } from 'lucide-react'
import api from '../api/client'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import { useSocketEvent } from '../hooks/useSocket'
import { useNotifications } from '../context/NotificationsContext'
import { candva } from '../utils/format'

const FILTRE = [
  { cheie: 'toate', eticheta: 'Toate' },
  { cheie: 'necitite', eticheta: 'Necitite' },
]

const SEVERITATI = [
  { cheie: '', eticheta: 'Toate severitățile' },
  { cheie: 'critic', eticheta: 'Critic' },
  { cheie: 'avertisment', eticheta: 'Avertisment' },
  { cheie: 'info', eticheta: 'Informativ' },
]

const STIL = {
  critic: { icon: AlertCircle, clasa: 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-300', border: 'border-l-red-500' },
  avertisment: { icon: AlertTriangle, clasa: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300', border: 'border-l-amber-500' },
  info: { icon: Info, clasa: 'text-brand-600 bg-brand-50 dark:bg-brand-900/30 dark:text-brand-300', border: 'border-l-brand-500' },
}

export default function Alerts() {
  const { reincarca } = useNotifications()
  const [alerte, setAlerte] = useState([])
  const [seIncarca, setSeIncarca] = useState(true)
  const [filtru, setFiltru] = useState('toate')
  const [severitate, setSeveritate] = useState('')

  const incarca = useCallback(() => {
    setSeIncarca(true)
    const params = new URLSearchParams()
    if (filtru === 'necitite') params.set('necitite', 'true')
    if (severitate) params.set('severitate', severitate)
    api
      .get(`/alerte?${params.toString()}`)
      .then((r) => setAlerte(r.data))
      .catch(() => {})
      .finally(() => setSeIncarca(false))
  }, [filtru, severitate])

  useEffect(() => {
    incarca()
  }, [incarca])

  const onAlerta = useCallback(
    (alerta) => {
      // Adaugă doar dacă respectă filtrele curente
      if (severitate && alerta.severitate !== severitate) return
      setAlerte((prev) => [alerta, ...prev])
    },
    [severitate],
  )
  useSocketEvent('alerta', onAlerta)

  const marcheazaCitita = async (alerta) => {
    if (alerta.citita) return
    try {
      await api.put(`/alerte/${alerta.id}/citeste`)
      setAlerte((prev) =>
        prev.map((a) => (a.id === alerta.id ? { ...a, citita: true } : a)),
      )
      reincarca()
    } catch {
      /* ignorat */
    }
  }

  const marcheazaToate = async () => {
    try {
      await api.put('/alerte/citeste-toate')
      setAlerte((prev) => prev.map((a) => ({ ...a, citita: true })))
      reincarca()
    } catch {
      /* ignorat */
    }
  }

  const sterge = async (id) => {
    try {
      await api.delete(`/alerte/${id}`)
      setAlerte((prev) => prev.filter((a) => a.id !== id))
      reincarca()
    } catch {
      /* ignorat */
    }
  }

  const numarNecitite = alerte.filter((a) => !a.citita).length

  return (
    <div className="animate-floatUp space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Alerte</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {numarNecitite > 0
              ? `${numarNecitite} alerte necitite`
              : 'Toate alertele au fost citite'}
          </p>
        </div>
        <button
          onClick={marcheazaToate}
          className="btn-secondary"
          disabled={numarNecitite === 0}
        >
          <CheckCheck className="h-4 w-4" /> Marchează toate ca citite
        </button>
      </div>

      {/* Filtre */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
          {FILTRE.map((f) => (
            <button
              key={f.cheie}
              onClick={() => setFiltru(f.cheie)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                filtru === f.cheie
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {f.eticheta}
            </button>
          ))}
        </div>
        <select
          className="input sm:w-56"
          value={severitate}
          onChange={(e) => setSeveritate(e.target.value)}
        >
          {SEVERITATI.map((s) => (
            <option key={s.cheie} value={s.cheie}>
              {s.eticheta}
            </option>
          ))}
        </select>
      </div>

      {/* Listă */}
      {seIncarca ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner text="Se încarcă alertele..." />
        </div>
      ) : alerte.length === 0 ? (
        <EmptyState
          icon={BellOff}
          titlu="Nicio alertă"
          descriere="Nu există alerte pentru filtrele selectate. Platforma generează alerte când dispozitivele depășesc pragurile configurate sau devin offline."
        />
      ) : (
        <div className="space-y-2.5">
          {alerte.map((a) => {
            const stil = STIL[a.severitate] || STIL.info
            const Icon = stil.icon
            return (
              <div
                key={a.id}
                className={`card flex items-start gap-3 border-l-4 p-4 ${stil.border} ${
                  a.citita ? 'opacity-70' : ''
                }`}
              >
                <div
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${stil.clasa}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{a.mesaj}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 dark:text-slate-500">
                    <span>{candva(a.creat_la)}</span>
                    {a.nume_dispozitiv && (
                      <Link
                        to={`/dispozitive/${a.dispozitiv_id}`}
                        className="inline-flex items-center gap-1 text-brand-600 hover:underline dark:text-brand-300"
                      >
                        {a.nume_dispozitiv} <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                    {!a.citita && (
                      <span className="badge bg-brand-100 text-brand-700">Nou</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-shrink-0 gap-1">
                  {!a.citita && (
                    <button
                      onClick={() => marcheazaCitita(a)}
                      title="Marchează ca citită"
                      className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400"
                    >
                      <CheckCheck className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => sterge(a.id)}
                    title="Șterge"
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
