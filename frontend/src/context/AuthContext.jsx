import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import api, { setAuthToken } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [utilizator, setUtilizator] = useState(null)
  const [seIncarca, setSeIncarca] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setSeIncarca(false)
      return
    }
    api
      .get('/auth/profil')
      .then((r) => setUtilizator(r.data))
      .catch(() => setAuthToken(null))
      .finally(() => setSeIncarca(false))
  }, [])

  const autentificare = useCallback(async (identificator, parola) => {
    const r = await api.post('/auth/autentificare', {
      nume_utilizator: identificator,
      parola,
    })
    setAuthToken(r.data.token)
    setUtilizator(r.data.utilizator)
    return r.data.utilizator
  }, [])

  const inregistrare = useCallback(async (date) => {
    const r = await api.post('/auth/inregistrare', date)
    setAuthToken(r.data.token)
    setUtilizator(r.data.utilizator)
    return r.data.utilizator
  }, [])

  const deconectare = useCallback(() => {
    setAuthToken(null)
    setUtilizator(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ utilizator, seIncarca, autentificare, inregistrare, deconectare }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth trebuie folosit în interiorul AuthProvider')
  return ctx
}
