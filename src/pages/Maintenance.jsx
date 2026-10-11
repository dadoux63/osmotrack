import { useState } from 'react'
import { doc } from 'firebase/firestore'
import { CheckCircle2, ChevronRight, CalendarCheck } from 'lucide-react'
import { firestoreDb } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useCollection } from '../hooks/useFirestore'
import { saveIntervention } from '../db/interventions'
import StatusBadge from '../components/StatusBadge'
import { getMaintenanceStatus, formatDate, formatDateLong, todayISO } from '../utils/maintenance'

const CATEGORIES = ['Tous', 'Filtres entrée', 'Adoucisseur', 'Lampe UV', 'Osmoseur', 'Analyse']

function daysLabel(days) {
  if (days === null) return 'Date inconnue'
  if (days < 0) return `${Math.abs(days)} j de retard`
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Demain'
  return `Dans ${days} j`
}

function MarkDoneModal({ item, uid, stocks, onConfirm, onClose }) {
  const [date, setDate] = useState(todayISO())
  const [cost, setCost] = useState('')
  const [notes, setNotes] = useState('')
  const [stockId, setStockId] = useState(
    stocks.some(st => st.id === item.defaultStockId) ? item.defaultStockId : ''
  )
  const [qty, setQty] = useState(String(item.defaultStockQty ?? 1))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const sortedStocks = [...stocks].sort((a, b) =>
    (b.category === item.category) - (a.category === item.category) || a.name.localeCompare(b.name, 'fr')
  )
  const selected = stocks.find(s => s.id === stockId)

  async function handleConfirm() {
    setError('')
    setSaving(true)
    try {
      await saveIntervention(uid, {
        values: {
          date,
          equipment: item.equipment,
          category: item.category?.toLowerCase() || 'maintenance',
          description: item.description,
          supplier: '',
          cost: cost ? Number(cost) : 0,
          technician: 'Propriétaire',
          notes,
        },
        link: selected && Number(qty) > 0 ? { stockId: selected.id, qty: -Number(qty) } : null,
        previous: null,
        stocks,
        extra: (batch) => batch.update(doc(firestoreDb, `users/${uid}/maintenance`, item.id), {
          lastDate: date,
          defaultStockId: selected?.id ?? null,
          defaultStockQty: selected ? Number(qty) : null,
        }),
      })
      onConfirm()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-brand-dark/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-stone-100">
          <h3 className="font-bold text-brand-dark font-serif">Marquer comme fait</h3>
          <p className="text-sm text-stone-500 mt-0.5">{item.equipment}</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label">Date d'intervention</label>
            <input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Coût (€)</label>
            <input type="number" min="0" step="0.01" className="input-field" placeholder="0" value={cost} onChange={e => setCost(e.target.value)} />
          </div>
          <div className="rounded-xl bg-stone-50 p-3 space-y-3">
            <p className="text-xs text-stone-500">
              Article utilisé (optionnel) : sa quantité est retirée du stock. Votre dernier choix est proposé la fois suivante.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="label">Article</label>
                <select className="input-field" value={stockId} onChange={e => setStockId(e.target.value)}>
                  <option value="">— Aucun —</option>
                  {sortedStocks.map(st => (
                    <option key={st.id} value={st.id}>{st.name} ({st.currentQty})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Quantité</label>
                <input
                  type="number" min="1" step="1" className="input-field"
                  disabled={!stockId} value={qty} onChange={e => setQty(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input-field resize-none" rows={2} placeholder="Observations…" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        {error && (
          <p className="mx-5 mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">{error}</p>
        )}
        <div className="p-5 pt-0 flex gap-3">
          <button className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
          <button className="btn-primary flex-1" onClick={handleConfirm} disabled={saving}>
            {saving ? '…' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Maintenance() {
  const [activeCategory, setActiveCategory] = useState('Tous')
  const [modalItem, setModalItem] = useState(null)
  const [done, setDone] = useState(null)
  const { currentUser } = useAuth()
  const uid = currentUser?.uid

  const maintenance = useCollection(uid ? `users/${uid}/maintenance` : null)
  const stocks = useCollection(uid ? `users/${uid}/stocks` : null)

  const items = maintenance
    ?.map(m => ({ ...m, ...getMaintenanceStatus(m.lastDate, m.intervalDays) }))
    .filter(m => activeCategory === 'Tous' || m.category === activeCategory)
    .sort((a, b) => (a.daysRemaining ?? -999) - (b.daysRemaining ?? -999))
    ?? []

  const urgentCount = items.filter(m => m.status === 'URGENT' || m.status === 'RETARD').length

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <div className="hidden lg:block mb-6">
        <h1 className="page-title">Planning maintenance</h1>
        <p className="text-sm text-stone-500 mt-0.5">{urgentCount} intervention(s) urgente(s)</p>
      </div>

      {/* Filtre catégorie */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 no-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'bg-brand text-white'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {items.map(item => (
          <div
            key={item.id}
            className={`card hover:shadow-md transition-shadow cursor-pointer
              ${item.status === 'URGENT' || item.status === 'RETARD' ? 'border-l-4 border-l-red-400' : ''}
              ${item.status === 'BIENTÔT' ? 'border-l-4 border-l-amber-400' : ''}
            `}
            onClick={() => setModalItem(item)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-brand-dark text-sm">{item.equipment}</p>
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-xs text-stone-500 mt-1 line-clamp-1">{item.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-stone-400">
                  <span>
                    Dernière : {item.lastDate ? formatDate(item.lastDate) : '—'}
                  </span>
                  {item.nextDate && (
                    <span className={
                      item.status === 'URGENT' || item.status === 'RETARD'
                        ? 'text-red-500 font-medium'
                        : item.status === 'BIENTÔT'
                        ? 'text-amber-600 font-medium'
                        : ''
                    }>
                      {daysLabel(item.daysRemaining)}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={16} className="text-stone-300 flex-shrink-0 mt-1" />
            </div>

            {/* Progress bar */}
            {item.daysRemaining !== null && item.intervalDays > 0 && (
              <div className="mt-3 h-1 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    item.status === 'URGENT' || item.status === 'RETARD' ? 'bg-red-400' :
                    item.status === 'BIENTÔT' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.max(2, item.pct)}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Success toast */}
      {done && (
        <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium z-50">
          <CheckCircle2 size={16} /> Intervention enregistrée
        </div>
      )}

      {/* Modal */}
      {modalItem && (
        <MarkDoneModal
          item={modalItem}
          uid={uid}
          stocks={stocks ?? []}
          onConfirm={() => {
            setModalItem(null)
            setDone(modalItem.id)
            setTimeout(() => setDone(null), 3000)
          }}
          onClose={() => setModalItem(null)}
        />
      )}
    </div>
  )
}
