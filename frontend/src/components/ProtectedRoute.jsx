import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from './Spinner'

export default function ProtectedRoute({ children }) {
  const { utilizator, seIncarca } = useAuth()

  if (seIncarca) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <Spinner text="Se încarcă platforma..." />
      </div>
    )
  }

  if (!utilizator) {
    return <Navigate to="/autentificare" replace />
  }

  return children
}
