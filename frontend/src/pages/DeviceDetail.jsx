import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { ro } from 'date-fns/locale'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  MapPin,
  Calendar,
  Clock,
  Send,
  Activity,
  AlertTriangle,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import api from '../api/client'
import Spinner from '../components/Spinner'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import DeviceModal from '../components/DeviceModal'
import EmptyState from '../components/EmptyState'
import { useSocketEvent } from '../hooks/useSocket'
import { metricaInfo, tipInfo } from '../utils/metrici'
import { dataOra, candva, numar } from '../utils/format'

const INTERVALE = [
  { ore: 1, eticheta: '1 oră' },
  { ore: 6, eticheta: '6 ore' },
  { ore: 24, eticheta: '24 ore' },
  { ore: 168, eticheta: '7 zile' },
]

export default function DeviceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [dispozitiv, setDispozitiv] = useState(null)
  const [seIncarca, setSeIncarca] = useState(true)
  const [metrica, setMetrica] = useState(null)
  const [ore, setOre] = useState(24)
  const [istoric, setIstoric] = useState([])
  const [seIncarcaGrafic, setSeIncarcaGrafic] = useState(false)

  const [modalEdit, setModalEdit] = useState(false)
  const [confirmStergere, setConfirmStergere] = useState(false)
  const [comanda, setComanda] = useState('')
  const [comandaStare, setComandaStare] = useState('')

  // Încarcă dispozitivul
  useEffect(() => {
    setSeIncarca(true)
    api
      .get(`/dispozitive/${id}`)
      .then((r) => {
        setDispozitiv(r.data)
        const prima =
          (r.data.metrici && r.data.metrici[0]) ||
          Object.keys(r.data.valori_curente || {})[0] ||
          null
        setMetrica(prima)
      })
      .catch(() => navigate('/dispozitive'))
      .finally(() => setSeIncarca(false))
  }, [id, navigate])

  // Încarcă istoricul telemetriei
  useEffect(() => {
    if (!metrica) {
      setIstoric([])
      return
    }
    setSeIncarcaGrafic(true)
    api
      .get(`/dispozitive/${id}/telemetrie?metrica=${metrica}&ore=${ore}`)
      .then((r) => setIstoric(r.data))
      .catch(() => setIstoric([]))
      .finally(() => setSeIncarcaGrafic(false))
  }, [id, metrica, ore])

  // Actualizări în timp real
  const onTelemetrie = useCallback(
    (date) => {
      if (date.dispozitiv_id !== Number(id)) return
      setDispozitiv((prev) => {
        if (!prev) return prev
        const valori = { ...(prev.valori_curente || {}) }
        for (const v of date.valori || []) {
          valori[v.metrica] = {
            valoare: v.valoare,
            unitate: v.unitate,
            inregistrat_la: v.inregistrat_la,
          }
        }
        return { ...prev, stare: date.stare || prev.stare, valori_curente: valori }
      })
      // Adaugă punctul nou pe grafic dacă este metrica selectată
      for (const v of date.valori || []) {
        if (v.metrica === metrica) {
          setIstoric((prev) => [...prev, v].slice(-2000))
        }
      }
    },
    [id, metrica],
  )

  const onDispozitivActualizat = useCallback(
    (date) => {
      if (date.id !== Number(id)) return
      setDispozitiv((prev) => (prev ? { ...prev, stare: date.stare } : prev))
    },
    [id],
  )

  useSocketEvent('telemetrie', onTelemetrie)
  useSocketEvent('dispozitiv_actualizat', onDispozitivActualizat)

  const dateGrafic = useMemo(
    () => istoric.map((t) => ({ timp: t.inregistrat_la, valoare: t.valoare })),
    [istoric],
  )

  const formatTick = (val) => {
    try {
      return format(parseISO(val), ore > 48 ? 'dd MMM' : 'HH:mm', { locale: ro })
    } catch {
      return ''
    }
  }

  const sterge = async () => {
    try {
      await api.delete(`/dispozitive/${id}`)
      navigate('/dispozitive')
    } catch {
      setConfirmStergere(false)
    }
  }

  const trimiteComanda = async () => {
    setComandaStare('')
    if (!comanda.trim()) return
    try {
      await api.post(`/dispozitive/${id}/comanda`, { comanda: comanda.trim() })
      setComandaStare('trimisa')
      setComanda('')
      setTimeout(() => setComandaStare(''), 3000)
    } catch (err) {
      setComandaStare(err?.response?.data?.eroare || 'Eroare la trimitere')
    }
  }

  if (seIncarca || !dispozitiv) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner text="Se încarcă dispozitivul..." />
      </div>
    )
  }

  const tip = tipInfo(dispozitiv.tip)
  const TipIcon = tip.icon
  const valori = dispozitiv.valori_curente || {}
  const cheiValori = Object.keys(valori)
  const infoMetrica = metrica ? metricaInfo(metrica) : null
  const pragMetrica = (dispozitiv.praguri || {})[metrica]

  return (
    <div className="space-y-5">
      <Link
        to="/dispozitive"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Înapoi la dispozitive
      </Link>

      {/* Antet */}
      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <TipIcon className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-800">{dispozitiv.nume}</h1>
              <StatusBadge stare={dispozitiv.stare} />
            </div>
            <p className="font-mono text-sm text-slate-400">{dispozitiv.cod_dispozitiv}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModalEdit(true)} className="btn-secondary">
            <Pencil className="h-4 w-4" /> Editează
          </button>
          <button onClick={() => setConfirmStergere(true)} className="btn-danger">
            <Trash2 className="h-4 w-4" /> Șterge
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Coloana principală */}
        <div className="space-y-5 lg:col-span-2">
          {/* Valori curente */}
          {cheiValori.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {cheiValori.map((cheie) => {
                const info = metricaInfo(cheie)
                const Icon = info.icon
                const v = valori[cheie]
                const activ = cheie === metrica
                return (
                  <button
                    key={cheie}
                    onClick={() => setMetrica(cheie)}
                    className={`card p-4 text-left transition-all ${
                      activ ? 'ring-2 ring-brand-500' : 'hover:shadow-md'
                    }`}
                  >
                    <Icon className="h-5 w-5" style={{ color: info.culoare }} />
                    <p className="mt-2 text-xs text-slate-400">{info.eticheta}</p>
                    <p className="text-xl font-bold text-slate-800">
                      {numar(v.valoare)}
                      <span className="ml-0.5 text-sm font-normal text-slate-400">
                        {v.unitate || info.unitate}
                      </span>
                    </p>
                  </button>
                )
              })}
            </div>
          )}

          {/* Grafic */}
          <div className="card">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                {infoMetrica && (
                  <infoMetrica.icon
                    className="h-5 w-5"
                    style={{ color: infoMetrica.culoare }}
                  />
                )}
                <h2 className="font-semibold text-slate-800">
                  {infoMetrica ? infoMetrica.eticheta : 'Telemetrie'}
                </h2>
              </div>
              <div className="flex rounded-xl border border-slate-200 bg-white p-1">
                {INTERVALE.map((interval) => (
                  <button
                    key={interval.ore}
                    onClick={() => setOre(interval.ore)}
                    className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                      ore === interval.ore
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {interval.eticheta}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5">
              {seIncarcaGrafic ? (
                <div className="flex h-72 items-center justify-center">
                  <Spinner />
                </div>
              ) : dateGrafic.length === 0 ? (
                <div className="flex h-72 items-center justify-center text-sm text-slate-400">
                  Nu există date pentru intervalul selectat.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dateGrafic} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="culoareGrafic" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={infoMetrica?.culoare || '#2563eb'}
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor={infoMetrica?.culoare || '#2563eb'}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="timp"
                      tickFormatter={formatTick}
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      minTickGap={40}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      width={45}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      labelFormatter={(val) => dataOra(val)}
                      formatter={(val) => [
                        `${numar(val)} ${infoMetrica?.unitate || ''}`,
                        infoMetrica?.eticheta || 'Valoare',
                      ]}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid #e2e8f0',
                        fontSize: 13,
                      }}
                    />
                    {pragMetrica?.max !== undefined && (
                      <ReferenceLine
                        y={pragMetrica.max}
                        stroke="#ef4444"
                        strokeDasharray="4 4"
                        label={{ value: 'Max', fontSize: 11, fill: '#ef4444', position: 'right' }}
                      />
                    )}
                    {pragMetrica?.min !== undefined && (
                      <ReferenceLine
                        y={pragMetrica.min}
                        stroke="#f59e0b"
                        strokeDasharray="4 4"
                        label={{ value: 'Min', fontSize: 11, fill: '#f59e0b', position: 'right' }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="valoare"
                      stroke={infoMetrica?.culoare || '#2563eb'}
                      strokeWidth={2}
                      fill="url(#culoareGrafic)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Coloana laterală */}
        <div className="space-y-5">
          {/* Informații */}
          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-slate-800">Informații</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <TipIcon className="h-4 w-4 text-slate-400" />
                <span>{tip.eticheta}</span>
              </div>
              {dispozitiv.locatie && (
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>{dispozitiv.locatie}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>Văzut {candva(dispozitiv.ultima_vazut)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Adăugat {dataOra(dispozitiv.creat_la)}</span>
              </div>
            </dl>
            {dispozitiv.descriere && (
              <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-500">
                {dispozitiv.descriere}
              </p>
            )}
          </div>

          {/* Praguri */}
          <div className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Praguri de alertare
            </h2>
            {Object.keys(dispozitiv.praguri || {}).length === 0 ? (
              <p className="text-sm text-slate-400">Niciun prag configurat.</p>
            ) : (
              <ul className="space-y-2">
                {Object.entries(dispozitiv.praguri).map(([m, p]) => {
                  const info = metricaInfo(m)
                  return (
                    <li
                      key={m}
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-slate-700">{info.eticheta}</span>
                      <span className="text-slate-500">
                        {p.min !== undefined && `min ${p.min}`}
                        {p.min !== undefined && p.max !== undefined && ' · '}
                        {p.max !== undefined && `max ${p.max}`} {info.unitate}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Trimite comandă */}
          <div className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
              <Send className="h-4 w-4 text-brand-500" /> Trimite comandă
            </h2>
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="ex: reporneste"
                value={comanda}
                onChange={(e) => setComanda(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && trimiteComanda()}
              />
              <button onClick={trimiteComanda} className="btn-primary flex-shrink-0">
                <Send className="h-4 w-4" />
              </button>
            </div>
            {comandaStare === 'trimisa' ? (
              <p className="mt-2 text-xs text-emerald-600">Comandă trimisă cu succes.</p>
            ) : comandaStare ? (
              <p className="mt-2 text-xs text-red-600">{comandaStare}</p>
            ) : (
              <p className="mt-2 text-xs text-slate-400">
                Comanda este publicată pe topicul MQTT al dispozitivului.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modale */}
      <DeviceModal
        deschis={modalEdit}
        onInchide={() => setModalEdit(false)}
        dispozitiv={dispozitiv}
        onSalvat={(device) => setDispozitiv((prev) => ({ ...prev, ...device }))}
      />

      <Modal
        deschis={confirmStergere}
        onInchide={() => setConfirmStergere(false)}
        titlu="Confirmă ștergerea"
        latime="max-w-md"
      >
        <p className="text-sm text-slate-600">
          Ești sigur că vrei să ștergi dispozitivul{' '}
          <span className="font-semibold text-slate-800">„{dispozitiv.nume}”</span>? Toate
          măsurătorile și alertele asociate vor fi șterse definitiv.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={() => setConfirmStergere(false)} className="btn-secondary">
            Anulează
          </button>
          <button onClick={sterge} className="btn-danger">
            <Trash2 className="h-4 w-4" /> Șterge definitiv
          </button>
        </div>
      </Modal>
    </div>
  )
}
