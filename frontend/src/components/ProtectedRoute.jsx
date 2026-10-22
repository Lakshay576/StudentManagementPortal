import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { homeFor } from '../utils/roles'

export default function ProtectedRoute({allowedRoles}) {
  const user = useSelector((s) => s.auth.user)
  const location = useLocation()

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={homeFor(user.role)} replace /> // wrong role -> send to their own dashboard
  }
  return <Outlet />
}