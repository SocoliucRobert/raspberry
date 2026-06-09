import axios from 'axios'

const baseURL = (import.meta.env.VITE_API_URL || '') + '/api'

const api = axios.create({ baseURL })

// Atașează token-ul salvat la pornire
const tokenInitial = localStorage.getItem('token')
if (tokenInitial) {
  api.defaults.headers.common['Authorization'] = `Bearer ${tokenInitial}`
}

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    localStorage.setItem('token', token)
  } else {
    delete api.defaults.headers.common['Authorization']
    localStorage.removeItem('token')
  }
}

// La expirarea sesiunii (401), curăță token-ul și redirecționează spre autentificare
api.interceptors.response.use(
  (raspuns) => raspuns,
  (eroare) => {
    const status = eroare?.response?.status
    const cale = window.location.pathname
    const peAuth = cale.startsWith('/autentificare') || cale.startsWith('/inregistrare')
    if (status === 401 && !peAuth) {
      setAuthToken(null)
      window.location.href = '/autentificare'
    }
    return Promise.reject(eroare)
  },
)

export default api
