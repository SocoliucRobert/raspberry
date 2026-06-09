import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/client'
import { useSocketEvent } from '../hooks/useSocket'

const NotificationsContext = createContext(null)

export function NotificationsProvider({ children }) {
  const [necitite, setNecitite] = useState(0)
  const [ultimaAlerta, setUltimaAlerta] = useState(null)

  const reincarca = useCallback(() => {
    api
      .get('/alerte/necitite')
      .then((r) => setNecitite(r.data.numar))
      .catch(() => {})
  }, [])

  useEffect(() => {
    reincarca()
  }, [reincarca])

  const onAlerta = useCallback((alerta) => {
    setNecitite((n) => n + 1)
    setUltimaAlerta({ ...alerta, _primitaLa: Date.now() })
  }, [])

  useSocketEvent('alerta', onAlerta)

  return (
    <NotificationsContext.Provider
      value={{ necitite, setNecitite, reincarca, ultimaAlerta }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications necesită NotificationsProvider')
  return ctx
}
