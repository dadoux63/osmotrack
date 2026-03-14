import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js'
import { TrendingUp, Euro } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCollection, useDocument } from '../hooks/useFirestore'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const CATEGORY_LABELS = {
  filtre: 'Filtres',
  membrane: 'Membrane',
  uv: 'UV / Quartz',
  adoucisseur: 'Adoucisseur',
  analyse: 'Analyses',
  achat: 'Achats / Outillage',
  maintenance: 'Maintenance',
}

const CATEGORY_COLORS = {
  filtre: '#185FA5',
  membrane: '#7c3aed',
  uv: '#d97706',
  adoucisseur: '#0d9488',
  analyse: '#6366f1',
  achat: '#94a3b8',
  maintenance: '#f97316',
}

const ANNUAL_BUDGET = 479

export default function Costs() {
  const { currentUser } = useAuth()
  const uid = currentUser?.uid
  const interventions = useCollection(uid ? `users/${uid}/interventions` : null)
  const budgetDoc = useDocument(uid ? `users/${uid}/settings` : null, 'annualBudget')
  const budget = budgetDoc?.value ?? ANNUAL_BUDGET

  if (!interventions) return null

  // Total global
  const totalSpent = interventions.reduce((s, i) => s + (i.cost || 0), 0)
  const budgetRemaining = budget - totalSpent
  const budgetPct = Math.round((totalSpent / budget) * 100)

  // Par catégorie
  const byCat = {}
  interventions.forEach(i => {
    const k = i.category || 'maintenance'
    byCat[k] = (byCat[k] || 0) + (i.cost || 0)
  })

  // Par année
  const byYear = {}
  interventions.forEach(i => {
    if (!i.date) return
    const year = i.date.split('-')[0]
    byYear[year] = (byYear[year] || 0) + (i.cost || 0)
  })
  const years = Object.keys(byYear).sort()

  // Doughnut
  const catKeys = Object.keys(byCat).filter(k => byCat[k] > 0)
  const doughnutData = {
    labels: catKeys.map(k => CATEGORY_LABELS[k] || k),
    datasets: [{
      data: catKeys.map(k => byCat[k]),
      backgroundColor: catKeys.map(k => CATEGORY_COLORS[k] || '#94a3b8'),
      borderWidth: 2,
      borderColor: '#f7f5f2',
    }],
  }
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { family: 'Palatino Linotype, Georgia, serif', size: 11 },
          boxWidth: 12, padding: 10,
        },
      },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.label} : ${ctx.parsed.toFixed(2)} €`,
        },
      },
    },
  }

  // Bar par année
  const barData = {
    labels: years,
    datasets: [
      {
        label: 'Dépenses (€)',
        data: years.map(y => byYear[y]),
        backgroundColor: '#185FA5',
        borderRadius: 6,
        barThickness: 40,
      },
      {
        label: 'Budget annuel (€)',
        data: years.map(() => budget),
        backgroundColor: 'rgba(24,95,165,0.12)',
        borderColor: '#185FA5',
        borderWidth: 1.5,
        borderDash: [5, 3],
        type: 'line',
        tension: 0,
        pointRadius: 0,
      },
    ],
  }
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { size: 11 }, boxWidth: 12, padding: 10 },
      },
      tooltip: {
        callbacks: { label: ctx => ` ${ctx.dataset.label} : ${ctx.parsed.y?.toFixed(2)} €` },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { color: '#f0ede8' },
        ticks: { callback: v => `${v} €` },
      },
    },
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
      <div className="hidden lg:block">
        <h1 className="page-title">Suivi des coûts</h1>
        <p className="text-sm text-stone-500 mt-0.5">Budget annuel estimé : {budget} €</p>
      </div>

      {/* KPIs budget */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card border-l-4 border-l-brand">
          <p className="kpi-label">Total dépensé</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="kpi-value">{totalSpent.toFixed(0)}</span>
            <span className="kpi-unit">€</span>
          </div>
          <p className="text-xs text-stone-400 mt-1">{interventions.length} interventions</p>
        </div>
        <div className={`card border-l-4 ${budgetRemaining >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
          <p className="kpi-label">{budgetRemaining >= 0 ? 'Restant budget' : 'Dépassement'}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="kpi-value">{Math.abs(budgetRemaining).toFixed(0)}</span>
            <span className="kpi-unit">€</span>
          </div>
          <p className="text-xs text-stone-400 mt-1">sur {budget} € / an</p>
        </div>
      </div>

      {/* Barre budget */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-brand-dark">Consommation budget annuel</p>
          <p className={`text-sm font-bold ${budgetPct > 100 ? 'text-red-600' : budgetPct > 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {budgetPct}%
          </p>
        </div>
        <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              budgetPct > 100 ? 'bg-red-500' : budgetPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, budgetPct)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <p className="text-xs text-stone-400">0 €</p>
          <p className="text-xs text-stone-400">{budget} €</p>
        </div>
      </div>

      {/* Graphique par année */}
      {years.length > 0 && (
        <div className="card-lg">
          <h2 className="section-title mb-4">Dépenses par année vs budget</h2>
          <div className="chart-container">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      )}

      {/* Graphique par catégorie */}
      {catKeys.length > 0 && (
        <div className="card-lg">
          <h2 className="section-title mb-4">Répartition par catégorie</h2>
          <div className="chart-container" style={{ height: 260 }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      )}

      {/* Détail par catégorie */}
      <div className="card-lg">
        <h2 className="section-title mb-4">Détail par catégorie</h2>
        <div className="space-y-2">
          {catKeys.sort((a, b) => byCat[b] - byCat[a]).map(k => (
            <div key={k} className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[k] || '#94a3b8' }} />
              <span className="text-sm flex-1 text-stone-600">{CATEGORY_LABELS[k] || k}</span>
              <span className="font-semibold text-brand-dark text-sm">{byCat[k].toFixed(2)} €</span>
              <span className="text-xs text-stone-400 w-10 text-right">{Math.round((byCat[k] / totalSpent) * 100)}%</span>
            </div>
          ))}
          <div className="flex items-center gap-3 pt-2 border-t border-stone-100 font-bold">
            <div className="w-2.5 flex-shrink-0" />
            <span className="text-sm flex-1 text-brand-dark">Total</span>
            <span className="text-brand-dark">{totalSpent.toFixed(2)} €</span>
            <span className="text-xs text-stone-400 w-10 text-right">100%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
