import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Cpu, Bell, Settings, Activity, X } from 'lucide-react'
import { useNotifications } from '../context/NotificationsContext'

const linkuri = [
  { catre: '/', eticheta: 'Panou de control', icon: LayoutDashboard, exact: true },
  { catre: '/dispozitive', eticheta: 'Dispozitive', icon: Cpu },
  { catre: '/alerte', eticheta: 'Alerte', icon: Bell, badge: true },
  { catre: '/setari', eticheta: 'Setări', icon: Settings },
]

export default function Sidebar({ deschis, onInchide }) {
  const { necitite } = useNotifications()

  return (
    <>
      {/* Overlay pe mobil */}
      {deschis && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={onInchide}
        />
      )}

      <aside
        className={`fixed z-40 flex h-full w-64 flex-col bg-slate-900 text-slate-300 transition-transform duration-200 lg:static lg:translate-x-0 ${
          deschis ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-white">Platformă IoT</p>
              <p className="text-[11px] text-slate-400">Monitorizare dispozitive</p>
            </div>
          </div>
          <button
            onClick={onInchide}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {linkuri.map((l) => {
            const Icon = l.icon
            return (
              <NavLink
                key={l.catre}
                to={l.catre}
                end={l.exact}
                onClick={onInchide}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  {l.eticheta}
                </span>
                {l.badge && necitite > 0 && (
                  <span className="badge bg-red-500 text-white">{necitite}</span>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <p className="text-center text-[11px] text-slate-500">
            Raspberry Pi 5 · Flask · React
          </p>
        </div>
      </aside>
    </>
  )
}
