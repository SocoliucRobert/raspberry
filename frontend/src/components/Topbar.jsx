import { useNavigate } from 'react-router-dom'
import { Menu, Bell, LogOut, Wifi, WifiOff, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationsContext'
import { useSocketStatus } from '../hooks/useSocket'

export default function Topbar({ titlu, onDeschideMeniu }) {
  const { utilizator, deconectare } = useAuth()
  const { necitite } = useNotifications()
  const conectat = useSocketStatus()
  const navigate = useNavigate()

  const iesire = () => {
    deconectare()
    navigate('/autentificare')
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onDeschideMeniu}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-800">{titlu}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Stare conexiune timp real */}
        <span
          className={`badge hidden sm:inline-flex ${
            conectat ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
          title={conectat ? 'Conectat în timp real' : 'Deconectat'}
        >
          {conectat ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {conectat ? 'Timp real' : 'Deconectat'}
        </span>

        {/* Clopoțel alerte */}
        <button
          onClick={() => navigate('/alerte')}
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          title="Alerte"
        >
          <Bell className="h-5 w-5" />
          {necitite > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {necitite > 99 ? '99+' : necitite}
            </span>
          )}
        </button>

        {/* Utilizator */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 py-1 pl-1 pr-2 dark:border-slate-700">
          {utilizator?.avatar_url ? (
            <img
              src={utilizator.avatar_url}
              alt={utilizator.nume_utilizator}
              className="h-8 w-8 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
              <User className="h-4 w-4" />
            </div>
          )}
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {utilizator?.nume_utilizator}
            </p>
            <p className="text-[11px] capitalize text-slate-400 dark:text-slate-500">{utilizator?.rol}</p>
          </div>
        </div>

        <button
          onClick={iesire}
          className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
          title="Deconectare"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
