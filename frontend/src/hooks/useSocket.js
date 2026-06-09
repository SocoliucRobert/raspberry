import { useEffect, useState } from 'react'
import { getSocket } from '../api/socket'

/** Abonează un handler la un eveniment WebSocket. */
export function useSocketEvent(eveniment, handler) {
  useEffect(() => {
    const socket = getSocket()
    socket.on(eveniment, handler)
    return () => socket.off(eveniment, handler)
  }, [eveniment, handler])
}

/** Returnează starea conexiunii WebSocket (true = conectat). */
export function useSocketStatus() {
  const [conectat, setConectat] = useState(false)

  useEffect(() => {
    const socket = getSocket()
    setConectat(socket.connected)
    const onConnect = () => setConectat(true)
    const onDisconnect = () => setConectat(false)
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [])

  return conectat
}
