import { io } from 'socket.io-client'

let socket = null

export function getSocket() {
  if (!socket) {
    const url = import.meta.env.VITE_API_URL || undefined
    socket = io(url, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
    })
  }
  return socket
}
