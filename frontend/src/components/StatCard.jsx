const CULORI = {
  brand: {
    icon: 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300',
    bara: 'from-brand-400 to-brand-600',
  },
  emerald: {
    icon: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300',
    bara: 'from-emerald-400 to-emerald-600',
  },
  red: {
    icon: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300',
    bara: 'from-red-400 to-red-600',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
    bara: 'from-amber-400 to-amber-600',
  },
  violet: {
    icon: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300',
    bara: 'from-violet-400 to-violet-600',
  },
  slate: {
    icon: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    bara: 'from-slate-300 to-slate-500',
  },
}

export default function StatCard({ titlu, valoare, icon: Icon, culoare = 'brand', subtext }) {
  const c = CULORI[culoare] || CULORI.brand
  return (
    <div className="card card-hover relative overflow-hidden p-5">
      <span
        className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${c.bara}`}
        aria-hidden="true"
      />
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">{titlu}</p>
          <p className="mt-1 text-3xl font-bold text-slate-800 dark:text-slate-100">{valoare}</p>
          {subtext && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{subtext}</p>}
        </div>
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${c.icon}`}
        >
          {Icon && <Icon className="h-6 w-6" />}
        </div>
      </div>
    </div>
  )
}
