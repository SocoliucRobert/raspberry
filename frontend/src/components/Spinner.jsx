import { Loader2 } from 'lucide-react'

export default function Spinner({ text, className = '' }) {
  return (
    <div className={`flex flex-col items-center gap-3 text-slate-500 ${className}`}>
      <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
      {text && <p className="text-sm font-medium">{text}</p>}
    </div>
  )
}
