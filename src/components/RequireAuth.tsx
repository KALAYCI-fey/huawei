import { Navigate, Outlet } from 'react-router-dom'
import { isAuthenticated } from '../store'

export function RequireAuth() {
  if (!isAuthenticated()) {
    return <Navigate to="/giris" replace />
  }
  return <Outlet />
}
