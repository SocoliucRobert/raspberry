import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Cpu, Bell, Settings, X } from 'lucide-react'
import { useNotifications } from '../context/NotificationsContext'
import UsuLogo from './UsuLogo'

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
        className={`fixed z-40 flex h-full w-64 flex-col text-slate-300 transition-transform duration-200 lg:static lg:translate-x-0 ${
          deschis ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          backgroundImage:
            'linear-gradient(180deg, #162f5c 0%, #1a3b73 55%, #1f4a8f 100%)',
        }}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-md">
              <UsuLogo className="h-7 w-7" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-white">Platformă IoT</p>
              <p className="text-[11px] text-brand-200">Monitorizare dispozitive</p>
            </div>
          </div>
          <button
            onClick={onInchide}
            className="rounded-lg p-1.5 text-brand-200 hover:bg-white/10 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-4">
          {linkuri.map((l) => {
            const Icon = l.icon
            return (
              <NavLink
                key={l.catre}
                to={l.catre}
                end={l.exact}
                onClick={onInchide}
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white/15 text-white shadow-inner ring-1 ring-white/10'
                      : 'text-brand-100 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                          isActive
                            ? 'bg-brand-300/30 text-white'
                            : 'bg-white/5 text-brand-200 group-hover:bg-white/10'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      {l.eticheta}
                    </span>
                    {l.badge && necitite > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                        {necitite > 99 ? '99+' : necitite}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow">
              <UsuLogo className="h-7 w-7" />
            </div>
            <div className="leading-tight">
              <p className="text-[12px] font-semibold text-white">USU</p>
              <p className="text-[10px] text-brand-200">
                Universitatea Ștefan cel Mare Suceava
              </p>
            </div>
          </div>
          <p className="mt-3 text-center text-[10px] text-brand-300/70">
            Raspberry Pi 5 · Flask · React
          </p>
        </div>
      </aside>
    </>
  )
}
