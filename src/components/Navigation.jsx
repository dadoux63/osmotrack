import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, PlusCircle, Wrench, History,
  Package, BarChart3, Settings, Droplets,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard',  label: 'Tableau de bord', Icon: LayoutDashboard },
  { to: '/releve',     label: 'Nouveau relevé',  Icon: PlusCircle },
  { to: '/maintenance',label: 'Maintenance',      Icon: Wrench },
  { to: '/historique', label: 'Historique',       Icon: History },
  { to: '/stocks',     label: 'Stocks',           Icon: Package },
  { to: '/couts',      label: 'Coûts',            Icon: BarChart3 },
  { to: '/parametres', label: 'Paramètres',       Icon: Settings },
]

// ── Sidebar (desktop) ─────────────────────────────────────────
export function Sidebar({ onClose }) {
  return (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-stone-100">
        <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center flex-shrink-0">
          <Droplets size={18} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-brand-dark text-lg leading-tight font-serif">OsmoTrack</p>
          <p className="text-xs text-stone-400 leading-tight">Eau de puits</p>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-stone-100">
        <p className="text-xs text-stone-400 text-center">
          Système Water Light 3 étapes
        </p>
      </div>
    </nav>
  )
}

// ── Bottom nav (mobile) ───────────────────────────────────────
// Show only first 5 items in bottom nav
const BOTTOM_ITEMS = NAV_ITEMS.slice(0, 5)

export function BottomNav() {
  return (
    <nav className="flex border-t border-stone-200 bg-white pb-safe">
      {BOTTOM_ITEMS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors duration-150 ${
              isActive ? 'text-brand' : 'text-stone-400'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={`font-medium ${isActive ? 'text-brand' : ''}`}>
                {label === 'Tableau de bord' ? 'Accueil' : label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export default Sidebar
