import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { AlertTriangle, Droplets, Activity, Package, Wrench } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCollection } from '../hooks/useFirestore'
import KPICard from '../components/KPICard'
import StatusBadge from '../components/StatusBadge'
import { getMaintenanceStatus, getStockStatus, formatDate } from '../utils/maintenance'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

function getRejectionAccent(rate) {
  if (!rate) return 'gray'
  if (rate >= 85) return 'green'
  if (rate >= 75) return 'orange'
  return 'red'
}

function getTdsAccent(tds) {
  if (!tds && tds !== 0) return 'gray'
  if (tds <= 30) return 'green'
  if (tds <= 50) return 'orange'
  return 'red'
}

export default function Dashboard() {
  const { currentUser } = useAuth()
  const uid = currentUser?.uid
  const readingsAll = useCollection(uid ? `users/${uid}/readings` : null)
  const maintenance = useCollection(uid ? `users/${uid}/maintenance` : null)
  const stocks = useCollection(uid ? `users/${uid}/stocks` : null)
  const readings = readingsAll
    ? [...readingsAll].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)
    : undefined

  const latest = readings?.[0]
  const urgentMaintenance = maintenance?.filter(m => {
    const { status } = getMaintenanceStatus(m.lastDate, m.intervalDays)
    return status === 'URGENT' || status === 'RETARD'
  }) ?? []
  const urgentStocks = stocks?.filter(s => {
    const st = getStockStatus(s.currentQty, s.minQty)
    return st === 'COMMANDER'
  }) ?? []

  // Chart data — TDS evolution (oldest → newest)
  const chartReadings = readings ? [...readings].reverse() : []
  const chartData = {
    labels: chartReadings.map(r => formatDate(r.date)),
    datasets: [
      {
        label: 'TDS entrée (ppm)',
        data: chartReadings.map(r => r.tdsIn),
        borderColor: '#94a3b8',
        backgroundColor: 'rgba(148,163,184,0.08)',
        tension: 0.3,
        fill: false,
        borderWidth: 1.5,
        pointRadius: 3,
      },
      {
        label: 'TDS sortie (ppm)',
        data: chartReadings.map(r => r.tdsOut),
        borderColor: '#185FA5',
        backgroundColor: 'rgba(24,95,165,0.10)',
        tension: 0.3,
        fill: true,
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: '#185FA5',
      },
    ],
  }
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { family: 'Palatino Linotype, Georgia, serif', size: 11 }, boxWidth: 12, padding: 12 },
      },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: {
        grid: { color: '#f0ede8' },
        ticks: { font: { size: 11 } },
        title: { display: true, text: 'ppm', font: { size: 11 } },
      },
    },
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="hidden lg:block">
        <h1 className="page-title">Tableau de bord</h1>
        <p className="text-sm text-stone-500 mt-0.5">Système Water Light 3 étapes — Puits privé</p>
      </div>

      {/* Alertes urgentes */}
      {(urgentMaintenance.length > 0 || urgentStocks.length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-red-600 flex-shrink-0" />
            <p className="font-bold text-red-700 text-sm">
              {urgentMaintenance.length + urgentStocks.length} alerte(s) urgente(s)
            </p>
          </div>
          <div className="space-y-1.5">
            {urgentMaintenance.map(m => (
              <div key={m.id} className="flex items-center justify-between text-sm">
                <span className="text-red-800">{m.equipment}</span>
                <StatusBadge status={getMaintenanceStatus(m.lastDate, m.intervalDays).status} />
              </div>
            ))}
            {urgentStocks.map(s => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span className="text-red-800">{s.name}</span>
                <StatusBadge status="COMMANDER" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="TDS sortie"
          value={latest?.tdsOut ?? '—'}
          unit="ppm"
          sub={latest ? formatDate(latest.date) : 'Aucune mesure'}
          accent={getTdsAccent(latest?.tdsOut)}
          icon={Droplets}
        />
        <KPICard
          label="Taux de rejet"
          value={latest?.rejectionRate != null ? `${latest.rejectionRate}` : '—'}
          unit="%"
          sub={latest ? <StatusBadge status={latest.status} /> : 'Aucune mesure'}
          accent={getRejectionAccent(latest?.rejectionRate)}
          icon={Activity}
        />
        <KPICard
          label="TDS entrée"
          value={latest?.tdsIn ?? '—'}
          unit="ppm"
          sub="Eau de puits"
          accent="gray"
          icon={Droplets}
        />
        <KPICard
          label="Alertes stock"
          value={urgentStocks.length}
          unit="articles"
          sub={urgentStocks.length === 0 ? 'Tout OK' : 'À commander'}
          accent={urgentStocks.length > 0 ? 'red' : 'green'}
          icon={Package}
        />
      </div>

      {/* Graphique évolution TDS */}
      <div className="card-lg">
        <h2 className="section-title mb-4">Évolution TDS</h2>
        {chartReadings.length > 0 ? (
          <div className="chart-container">
            <Line data={chartData} options={chartOptions} />
          </div>
        ) : (
          <p className="text-stone-400 text-sm text-center py-8">Aucune donnée disponible</p>
        )}
      </div>

      {/* Prochaines maintenances */}
      <div className="card-lg">
        <h2 className="section-title mb-4">Planning maintenance</h2>
        <div className="space-y-2">
          {maintenance
            ?.map(m => ({ ...m, ...getMaintenanceStatus(m.lastDate, m.intervalDays) }))
            .sort((a, b) => (a.daysRemaining ?? -999) - (b.daysRemaining ?? -999))
            .slice(0, 6)
            .map(m => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Wrench size={14} className="text-stone-400 flex-shrink-0" />
                  <span className="text-sm text-brand-dark truncate">{m.equipment}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  {m.daysRemaining !== null && (
                    <span className="text-xs text-stone-400">
                      {m.daysRemaining < 0
                        ? `${Math.abs(m.daysRemaining)}j de retard`
                        : `dans ${m.daysRemaining}j`}
                    </span>
                  )}
                  <StatusBadge status={m.status} />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Eau source */}
      <div className="card">
        <h2 className="section-title mb-3">Analyse eau source (02/04/2024)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'TH', value: '37,3', unit: '°f' },
            { label: 'Nitrates', value: '30', unit: 'mg/L' },
            { label: 'Conductivité', value: '717', unit: 'µS/cm' },
            { label: 'COT', value: '0,98', unit: 'mg/L' },
          ].map(({ label, value, unit }) => (
            <div key={label} className="text-center bg-stone-50 rounded-lg py-3 px-2">
              <p className="text-xs text-stone-500 uppercase tracking-wider">{label}</p>
              <p className="text-lg font-bold text-brand-dark mt-0.5">{value} <span className="text-xs font-normal text-stone-400">{unit}</span></p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
