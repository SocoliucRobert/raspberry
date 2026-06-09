import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import AlertToast from './AlertToast'
import { NotificationsProvider } from '../context/NotificationsContext'

function titluPagina(cale) {
  if (cale === '/') return 'Panou de control'
  if (cale.startsWith('/dispozitive/')) return 'Detalii dispozitiv'
  if (cale.startsWith('/dispozitive')) return 'Dispozitive'
  if (cale.startsWith('/alerte')) return 'Alerte'
  if (cale.startsWith('/setari')) return 'Setări'
  return 'Platformă IoT'
}

export default function Layout() {
  const [meniuDeschis, setMeniuDeschis] = useState(false)
  const location = useLocation()

  return (
    <NotificationsProvider>
      <div className="flex h-screen overflow-hidden bg-slate-100">
        <Sidebar deschis={meniuDeschis} onInchide={() => setMeniuDeschis(false)} />

        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar
            titlu={titluPagina(location.pathname)}
            onDeschideMeniu={() => setMeniuDeschis(true)}
          />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <Outlet />
          </main>
        </div>

        <AlertToast />
      </div>
    </NotificationsProvider>
  )
}
