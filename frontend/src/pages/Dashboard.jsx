import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Cpu,
  Wifi,
  WifiOff,
  Bell,
  ArrowRight,
  Inbox,
  PieChart as PieIcon,
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts'
import api from '../api/client'
import StatCard from '../components/StatCard'
import DeviceCard from '../components/DeviceCard'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import SeverityBadge from '../components/SeverityBadge'
import { useSocketEvent } from '../hooks/useSocket'
import { useNotifications } from '../context/NotificationsContext'
import { tipInfo } from '../utils/metrici'
import { candva } from '../utils/format'

const PALETA = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899']

export default function Dashboard() {
  const { necitite } = useNotifications()
  const [dispozitive, setDispozitive] = useState([])
  const [alerte, setAlerte] = useState([])
  const [seIncarca, setSeIncarca] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/dispozitive'), api.get('/alerte?limita=6')])
      .then(([d, a]) => {
        setDispozitive(d.data)
        setAlerte(a.data)
      })
      .catch(() => {})
      .finally(() => setSeIncarca(false))
  }, [])

  // Actualizare în timp real a valorilor și stării dispozitivelor
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

  const onAlerta = useCallback((alerta) => {
    setAlerte((prev) => [alerta, ...prev].slice(0, 6))
  }, [])

  useSocketEvent('telemetrie', onTelemetrie)
  useSocketEvent('dispozitiv_actualizat', onDispozitivActualizat)
  useSocketEvent('alerta', onAlerta)

  const stats = useMemo(() => {
    const total = dispozitive.length
    const online = dispozitive.filter((d) => d.stare === 'online').length
    return { total, online, offline: total - online }
  }, [dispozitive])

  const distributie = useMemo(() => {
    const grupe = {}
    for (const d of dispozitive) {
      grupe[d.tip] = (grupe[d.tip] || 0) + 1
    }
    return Object.entries(grupe).map(([tip, value]) => ({
      name: tipInfo(tip).eticheta,
      value,
    }))
  }, [dispozitive])

  if (seIncarca) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner text="Se încarcă datele..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Carduri statistici */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard titlu="Total dispozitive" valoare={stats.total} icon={Cpu} culoare="brand" />
        <StatCard titlu="Online" valoare={stats.online} icon={Wifi} culoare="emerald" />
        <StatCard titlu="Offline" valoare={stats.offline} icon={WifiOff} culoare="slate" />
        <StatCard titlu="Alerte necitite" valoare={necitite} icon={Bell} culoare="red" />
      </div>

      {/* Alerte recente + Distribuție */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Alerte recente */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-800">Alerte recente</h2>
            <Link
              to="/alerte"
              className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Vezi toate <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {alerte.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">
              Nu există alerte. Totul funcționează normal.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {alerte.map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-5 py-3.5">
                  <SeverityBadge severitate={a.severitate} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700">{a.mesaj}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{candva(a.creat_la)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Distribuție pe tipuri */}
        <div className="card">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <PieIcon className="h-4 w-4 text-slate-400" />
            <h2 className="font-semibold text-slate-800">Distribuție pe tipuri</h2>
          </div>
          <div className="p-5">
            {distributie.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">Niciun dispozitiv</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={distributie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {distributie.map((_, i) => (
                        <Cell key={i} fill={PALETA[i % PALETA.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-2">
                  {distributie.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-slate-600">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: PALETA[i % PALETA.length] }}
                        />
                        {d.name}
                      </span>
                      <span className="font-semibold text-slate-800">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dispozitivele tale */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Dispozitivele tale</h2>
          <Link
            to="/dispozitive"
            className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Vezi toate <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {dispozitive.length === 0 ? (
          <EmptyState
            icon={Inbox}
            titlu="Niciun dispozitiv înregistrat"
            descriere="Adaugă primul tău dispozitiv IoT pentru a începe monitorizarea."
            actiune={
              <Link to="/dispozitive" className="btn-primary">
                Adaugă dispozitiv
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {dispozitive.slice(0, 6).map((d) => (
              <DeviceCard key={d.id} dispozitiv={d} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
