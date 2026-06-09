const CULORI = {
  brand: 'bg-brand-50 text-brand-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  red: 'bg-red-50 text-red-600',
  amber: 'bg-amber-50 text-amber-600',
  violet: 'bg-violet-50 text-violet-600',
  slate: 'bg-slate-100 text-slate-600',
}

export default function StatCard({ titlu, valoare, icon: Icon, culoare = 'brand', subtext }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-500">{titlu}</p>
          <p className="mt-1 text-3xl font-bold text-slate-800">{valoare}</p>
          {subtext && <p className="mt-1 text-xs text-slate-400">{subtext}</p>}
        </div>
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${
            CULORI[culoare] || CULORI.brand
          }`}
        >
          {Icon && <Icon className="h-6 w-6" />}
        </div>
      </div>
    </div>
  )
}
