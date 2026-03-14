import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NewReading from './pages/NewReading'
import Maintenance from './pages/Maintenance'
import History from './pages/History'
import Stocks from './pages/Stocks'
import Costs from './pages/Costs'
import Settings from './pages/Settings'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
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
  )
}
