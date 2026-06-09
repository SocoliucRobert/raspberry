import { Link } from 'react-router-dom'
import { MapPin, ChevronRight } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { metricaInfo, tipInfo } from '../utils/metrici'
import { candva, numar } from '../utils/format'

export default function DeviceCard({ dispozitiv }) {
  const tip = tipInfo(dispozitiv.tip)
  const TipIcon = tip.icon
  const valori = dispozitiv.valori_curente || {}
  const cheiValori = Object.keys(valori).slice(0, 4)

  return (
    <Link
      to={`/dispozitive/${dispozitiv.id}`}
      className="card group flex flex-col p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <TipIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-slate-800">{dispozitiv.nume}</h3>
            <p className="truncate font-mono text-xs text-slate-400">
              {dispozitiv.cod_dispozitiv}
            </p>
          </div>
        </div>
        <StatusBadge stare={dispozitiv.stare} />
      </div>

      {dispozitiv.locatie && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin className="h-4 w-4" />
          {dispozitiv.locatie}
        </p>
      )}

      {cheiValori.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {cheiValori.map((cheie) => {
            const info = metricaInfo(cheie)
            const Icon = info.icon
            const v = valori[cheie]
            return (
              <div
                key={cheie}
                className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2"
              >
                <Icon className="h-4 w-4 flex-shrink-0" style={{ color: info.culoare }} />
                <div className="min-w-0">
                  <p className="truncate text-[11px] text-slate-400">{info.eticheta}</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {numar(v.valoare)}
                    <span className="ml-0.5 text-xs font-normal text-slate-400">
                      {v.unitate || info.unitate}
                    </span>
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-center text-xs text-slate-400">
          Nu există măsurători încă
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-400">
          Văzut {candva(dispozitiv.ultima_vazut)}
        </span>
        <span className="flex items-center gap-1 text-xs font-medium text-brand-600 group-hover:gap-1.5">
          Detalii <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  )
}
