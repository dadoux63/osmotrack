import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Trash2, Filter, Euro } from 'lucide-react'
import db from '../db/database'
import { formatDateLong } from '../utils/maintenance'

const CATEGORIES = {
  filtre: { label: 'Filtre', color: 'bg-blue-100 text-blue-700' },
  membrane: { label: 'Membrane', color: 'bg-purple-100 text-purple-700' },
  uv: { label: 'UV', color: 'bg-amber-100 text-amber-700' },
  adoucisseur: { label: 'Adoucisseur', color: 'bg-teal-100 text-teal-700' },
  analyse: { label: 'Analyse', color: 'bg-indigo-100 text-indigo-700' },
  achat: { label: 'Achat', color: 'bg-stone-100 text-stone-600' },
  maintenance: { label: 'Maintenance', color: 'bg-orange-100 text-orange-700' },
}

function CategoryTag({ category }) {
  const cfg = CATEGORIES[category] || CATEGORIES['maintenance']
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

export default function History() {
  const [filterCategory, setFilterCategory] = useState('tous')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const interventions = useLiveQuery(() =>
    db.interventions.orderBy('date').reverse().toArray()
  )

  const readings = useLiveQuery(() =>
    db.readings.orderBy('date').reverse().toArray()
  )

  const filtered = interventions?.filter(i =>
    filterCategory === 'tous' || i.category === filterCategory
  ) ?? []

  const totalCost = filtered.reduce((s, i) => s + (i.cost || 0), 0)
  const allTotal = interventions?.reduce((s, i) => s + (i.cost || 0), 0) ?? 0

  async function deleteIntervention(id) {
    await db.interventions.delete(id)
    setConfirmDelete(null)
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <div className="hidden lg:block mb-6">
        <h1 className="page-title">Historique interventions</h1>
        <p className="text-sm text-stone-500 mt-0.5">
          {interventions?.length ?? 0} interventions · Total : {allTotal.toFixed(2)} €
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-5">
        {[['tous', 'Tous'], ...Object.entries(CATEGORIES).map(([k, v]) => [k, v.label])].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFilterCategory(k)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              filterCategory === k
                ? 'bg-brand text-white'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Total filtré */}
      {filterCategory !== 'tous' && (
        <div className="card mb-4 flex items-center justify-between">
          <span className="text-sm text-stone-500">Total filtré</span>
          <span className="font-bold text-brand-dark">{totalCost.toFixed(2)} €</span>
        </div>
      )}

      {/* Interventions */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-stone-400 text-sm text-center py-10">Aucune intervention</p>
        )}
        {filtered.map(item => (
          <div key={item.id} className="card">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <CategoryTag category={item.category} />
                  <span className="text-xs text-stone-400">{formatDateLong(item.date)}</span>
                </div>
                <p className="font-medium text-brand-dark text-sm">{item.description}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-stone-500">
                  {item.supplier && <span>{item.supplier}</span>}
                  {item.technician && <span>— {item.technician}</span>}
                </div>
                {item.notes && (
                  <p className="text-xs text-stone-400 mt-1 italic">{item.notes}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className={`font-bold text-sm ${item.cost > 0 ? 'text-brand-dark' : 'text-stone-400'}`}>
                  {item.cost > 0 ? `${item.cost.toFixed(2)} €` : 'Gratuit'}
                </span>
                <button
                  onClick={() => setConfirmDelete(item)}
                  className="text-stone-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Relevés TDS */}
      <div className="mt-8">
        <h2 className="section-title mb-4">Relevés TDS ({readings?.length ?? 0})</h2>
        <div className="space-y-2">
          {readings?.map(r => (
            <div key={r.id} className="card flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-stone-400">{r.date}</p>
                <p className="text-sm font-medium text-brand-dark mt-0.5">
                  Entrée {r.tdsIn} ppm → Sortie {r.tdsOut} ppm
                </p>
                {r.notes && <p className="text-xs text-stone-400 mt-0.5 italic">{r.notes}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold text-brand-dark">{r.rejectionRate}%</p>
                <p className="text-xs text-stone-400">rejet</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5">
            <p className="font-bold text-brand-dark mb-2">Supprimer cette entrée ?</p>
            <p className="text-sm text-stone-500 mb-5">{confirmDelete.description}</p>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setConfirmDelete(null)}>Annuler</button>
              <button className="btn-danger flex-1" onClick={() => deleteIntervention(confirmDelete.id)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
