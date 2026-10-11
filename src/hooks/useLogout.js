import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function useLogout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }
}
