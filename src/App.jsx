import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NewReading from './pages/NewReading'
import Maintenance from './pages/Maintenance'
import History from './pages/History'
import Stocks from './pages/Stocks'
import Costs from './pages/Costs'
import Settings from './pages/Settings'
import Login from './pages/Login'

function PrivateRoute({ children }) {
  const { currentUser } = useAuth()

  // Still loading session from IndexedDB
  if (currentUser === undefined) return null

  if (!currentUser) return <Navigate to="/login" replace />

  return children
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="releve" element={<NewReading />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="historique" element={<History />} />
            <Route path="stocks" element={<Stocks />} />
            <Route path="couts" element={<Costs />} />
            <Route path="parametres" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
