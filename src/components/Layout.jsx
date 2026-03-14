import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Sidebar, BottomNav } from './Navigation'

const PAGE_TITLES = {
  '/dashboard':   'Tableau de bord',
  '/releve':      'Nouveau relevé',
  '/maintenance': 'Maintenance',
  '/historique':  'Historique',
  '/stocks':      'Stocks',
  '/couts':       'Coûts',
  '/parametres':  'Paramètres',
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] || 'OsmoTrack'

  return (
    <div className="flex h-screen h-dvh bg-cream overflow-hidden">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-56 xl:w-64 bg-white border-r border-stone-100 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* ── Mobile drawer overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-brand-dark/30 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 h-full bg-white shadow-xl">
            <button
              className="absolute top-3 right-3 p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 z-10"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-stone-100 flex-shrink-0">
          <button
            className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <h1 className="font-bold text-brand-dark font-serif">{title}</h1>
          <div className="w-9" /> {/* spacer */}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <div className="lg:hidden flex-shrink-0">
          <BottomNav />
        </div>
      </div>
    </div>
  )
}
