import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Search, Inbox, Cpu } from 'lucide-react'
import api from '../api/client'
import DeviceCard from '../components/DeviceCard'
import DeviceModal from '../components/DeviceModal'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import { useSocketEvent } from '../hooks/useSocket'

const FILTRE = [
  { cheie: 'toate', eticheta: 'Toate' },
  { cheie: 'online', eticheta: 'Online' },
  { cheie: 'offline', eticheta: 'Offline' },
]

export default function Devices() {
  const [dispozitive, setDispozitive] = useState([])
  const [seIncarca, setSeIncarca] = useState(true)
  const [cautare, setCautare] = useState('')
  const [filtru, setFiltru] = useState('toate')
  const [modalDeschis, setModalDeschis] = useState(false)

  useEffect(() => {
    api
      .get('/dispozitive')
      .then((r) => setDispozitive(r.data))
      .catch(() => {})
      .finally(() => setSeIncarca(false))
  }, [])

  const onTelemetrie = useCallback((date) => {
    setDispozitive((prev) =>
      prev.map((d) => {
        if (d.id !== date.dispozitiv_id) return d
        const valori = { ...(d.valori_curente || {}) }
        for (const v of date.valori || []) {
          valori[v.metrica] = {
            valoare: v.valoare,
            unitate: v.unitate,
            inregistrat_la: v.inregistrat_la,
          }
        }
        return {
          ...d,
          stare: date.stare || d.stare,
          valori_curente: valori,
          ultima_vazut: new Date().toISOString(),
        }
      }),
    )
  }, [])

  const onDispozitivActualizat = useCallback((date) => {
    setDispozitive((prev) =>
      prev.map((d) => (d.id === date.id ? { ...d, stare: date.stare } : d)),
    )
  }, [])

  useSocketEvent('telemetrie', onTelemetrie)
  useSocketEvent('dispozitiv_actualizat', onDispozitivActualizat)

  const onSalvat = (device, eDeEditare) => {
    if (eDeEditare) {
      setDispozitive((prev) => prev.map((d) => (d.id === device.id ? device : d)))
    } else {
      setDispozitive((prev) => [device, ...prev])
    }
  }

  const listaFiltrata = useMemo(() => {
    const q = cautare.trim().toLowerCase()
    return dispozitive.filter((d) => {
      const potrivireStare = filtru === 'toate' || d.stare === filtru
      const potrivireText =
        !q ||
        d.nume.toLowerCase().includes(q) ||
        d.cod_dispozitiv.toLowerCase().includes(q) ||
        (d.locatie || '').toLowerCase().includes(q)
      return potrivireStare && potrivireText
    })
  }, [dispozitive, cautare, filtru])

  return (
    <div className="animate-floatUp space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Dispozitive</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {dispozitive.length} dispozitive înregistrate
          </p>
        </div>
        <button onClick={() => setModalDeschis(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Adaugă dispozitiv
        </button>
      </div>

      {/* Filtre */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-10"
            placeholder="Caută după nume, cod sau locație..."
            value={cautare}
            onChange={(e) => setCautare(e.target.value)}
          />
        </div>
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
      </div>

      {/* Listă */}
      {seIncarca ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner text="Se încarcă dispozitivele..." />
        </div>
      ) : dispozitive.length === 0 ? (
        <EmptyState
          icon={Inbox}
          titlu="Niciun dispozitiv înregistrat"
          descriere="Adaugă primul tău dispozitiv IoT pentru a începe monitorizarea telemetriei în timp real."
          actiune={
            <button onClick={() => setModalDeschis(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> Adaugă dispozitiv
            </button>
          }
        />
      ) : listaFiltrata.length === 0 ? (
        <EmptyState
          icon={Cpu}
          titlu="Niciun rezultat"
          descriere="Niciun dispozitiv nu corespunde filtrelor selectate."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {listaFiltrata.map((d) => (
            <DeviceCard key={d.id} dispozitiv={d} />
          ))}
        </div>
      )}

      <DeviceModal
        deschis={modalDeschis}
        onInchide={() => setModalDeschis(false)}
        dispozitiv={null}
        onSalvat={onSalvat}
      />
    </div>
  )
}
