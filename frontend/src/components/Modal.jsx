import { X } from 'lucide-react'

export default function Modal({ deschis, onInchide, titlu, children, latime = 'max-w-lg' }) {
  if (!deschis) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onInchide} />
      <div className={`relative w-full ${latime} card max-h-[90vh] overflow-y-auto`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <h3 className="font-semibold text-slate-800">{titlu}</h3>
          <button
            onClick={onInchide}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
