import { useEffect, useState } from 'react'
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react'
import { useNotifications } from '../context/NotificationsContext'

const STIL = {
  critic: { icon: AlertCircle, clasa: 'border-red-200 bg-red-50', iconClasa: 'text-red-600' },
  avertisment: {
    icon: AlertTriangle,
    clasa: 'border-amber-200 bg-amber-50',
    iconClasa: 'text-amber-600',
  },
  info: { icon: Info, clasa: 'border-brand-200 bg-brand-50', iconClasa: 'text-brand-600' },
}

export default function AlertToast() {
  const { ultimaAlerta } = useNotifications()
  const [alerta, setAlerta] = useState(null)
  const [vizibil, setVizibil] = useState(false)

  useEffect(() => {
    if (!ultimaAlerta) return
    setAlerta(ultimaAlerta)
    setVizibil(true)
    const t = setTimeout(() => setVizibil(false), 6000)
    return () => clearTimeout(t)
  }, [ultimaAlerta])

  if (!vizibil || !alerta) return null

  const stil = STIL[alerta.severitate] || STIL.info
  const Icon = stil.icon

  return (
    <div className="animate-fadeIn fixed bottom-5 right-5 z-50 w-[22rem] max-w-[calc(100vw-2.5rem)]">
      <div className={`card flex items-start gap-3 border p-4 shadow-lg ${stil.clasa}`}>
        <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${stil.iconClasa}`} />
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-800">Alertă nouă</p>
          <p className="mt-0.5 text-sm text-slate-600">{alerta.mesaj}</p>
        </div>
        <button
          onClick={() => setVizibil(false)}
          className="rounded-lg p-1 text-slate-400 hover:bg-white/60"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
