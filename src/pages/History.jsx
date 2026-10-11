import { useState } from 'react'
import { Trash2, Pencil, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCollection } from '../hooks/useFirestore'
import { saveIntervention, removeIntervention } from '../db/interventions'
import { formatDateLong, todayISO } from '../utils/maintenance'

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
  const [editForm, setEditForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const { currentUser } = useAuth()
  const uid = currentUser?.uid

  const interventionsRaw = useCollection(uid ? `users/${uid}/interventions` : null)
  const readingsRaw = useCollection(uid ? `users/${uid}/readings` : null)
  const stocksRaw = useCollection(uid ? `users/${uid}/stocks` : null)
  const stocks = stocksRaw ? [...stocksRaw].sort((a, b) => a.name.localeCompare(b.name, 'fr')) : []
  const interventions = interventionsRaw
    ? [...interventionsRaw].sort((a, b) => b.date.localeCompare(a.date))
    : undefined
  const readings = readingsRaw
    ? [...readingsRaw].sort((a, b) => b.date.localeCompare(a.date))
    : undefined

  const filtered = interventions?.filter(i =>
    filterCategory === 'tous' || i.category === filterCategory
  ) ?? []

  const totalCost = filtered.reduce((s, i) => s + (i.cost || 0), 0)
  const allTotal = interventions?.reduce((s, i) => s + (i.cost || 0), 0) ?? 0

  function startCreate() {
    setEditForm({
      id: null,
      date: todayISO(),
      category: 'achat',
      equipment: '',
      description: '',
      supplier: '',
      technician: 'Propriétaire',
      cost: '',
      notes: '',
      stockId: '',
      stockQty: '',
    })
  }

  function startEdit(item) {
    setEditForm({
      id: item.id,
      stockId: item.stockId ?? '',
      stockQty: item.stockQty ? String(item.stockQty) : '',
      date: item.date ?? '',
      category: item.category ?? 'maintenance',
      equipment: item.equipment ?? '',
      description: item.description ?? '',
      supplier: item.supplier ?? '',
      technician: item.technician ?? '',
      cost: item.cost ? String(item.cost) : '',
      notes: item.notes ?? '',
    })
  }

  function setEdit(field) {
    return (e) => setEditForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function saveEdit(e) {
    e.preventDefault()
    const { id, cost, stockId, stockQty, ...rest } = editForm
    const qty = Number(stockQty)
    const link = rest.category === 'achat' && stockId && qty > 0 ? { stockId, qty } : null
    const previous = id ? interventionsRaw?.find(i => i.id === id) ?? null : null
    setSaving(true)
    try {
      await saveIntervention(uid, {
        id,
        values: { ...rest, description: rest.description.trim(), cost: cost ? Number(cost) : 0 },
        link,
        previous,
        stocks,
      })
      setEditForm(null)
    } finally {
      setSaving(false)
    }
  }

  async function deleteIntervention(item) {
    await removeIntervention(uid, item, stocks)
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
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => startEdit(item)}
                    className="text-stone-300 hover:text-brand transition-colors"
                    aria-label="Modifier"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(item)}
                    className="text-stone-300 hover:text-red-500 transition-colors"
                    aria-label="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
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

      <button
        onClick={startCreate}
        aria-label="Ajouter une intervention"
        className="fixed bottom-24 lg:bottom-6 right-4 lg:right-6 w-12 h-12 bg-brand text-white rounded-full shadow-lg flex items-center justify-center hover:bg-brand-light transition-colors z-40"
      >
        <Plus size={22} />
      </button>

      {/* Ajouter / modifier une intervention */}
      {editForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-brand-dark/30 backdrop-blur-sm">
          <form
            onSubmit={saveEdit}
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <p className="font-bold text-brand-dark font-serif">
              {editForm.id ? "Modifier l'intervention" : 'Nouvelle intervention'}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Date</label>
                <input type="date" className="input-field" required value={editForm.date} onChange={setEdit('date')} />
              </div>
              <div>
                <label className="label">Catégorie</label>
                <select className="input-field" value={editForm.category} onChange={setEdit('category')}>
                  {Object.entries(CATEGORIES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Description</label>
              <input className="input-field" required value={editForm.description} onChange={setEdit('description')} />
            </div>

            <div>
              <label className="label">Équipement</label>
              <input className="input-field" value={editForm.equipment} onChange={setEdit('equipment')} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Fournisseur</label>
                <input className="input-field" value={editForm.supplier} onChange={setEdit('supplier')} />
              </div>
              <div>
                <label className="label">Prix <span className="normal-case font-normal">(€)</span></label>
                <input
                  type="number" min="0" step="0.01" className="input-field" placeholder="0"
                  value={editForm.cost} onChange={setEdit('cost')}
                />
              </div>
            </div>

            {editForm.category === 'achat' && (
              <div className="rounded-xl bg-stone-50 p-3 space-y-3">
                <p className="text-xs text-stone-500">
                  Lier à un article pour ajouter la quantité achetée au stock (le prix unitaire est mis à jour).
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="label">Article en stock</label>
                    <select className="input-field" value={editForm.stockId} onChange={setEdit('stockId')}>
                      <option value="">— Aucun —</option>
                      {stocks.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Quantité</label>
                    <input
                      type="number" min="1" step="1" className="input-field"
                      required={Boolean(editForm.stockId)}
                      value={editForm.stockQty} onChange={setEdit('stockQty')}
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="label">Intervenant</label>
              <input className="input-field" value={editForm.technician} onChange={setEdit('technician')} />
            </div>

            <div>
              <label className="label">Remarques</label>
              <textarea className="input-field resize-none" rows={2} value={editForm.notes} onChange={setEdit('notes')} />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" className="btn-secondary flex-1" onClick={() => setEditForm(null)}>Annuler</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? '…' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5">
            <p className="font-bold text-brand-dark mb-2">Supprimer cette entrée ?</p>
            <p className="text-sm text-stone-500 mb-5">{confirmDelete.description}</p>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setConfirmDelete(null)}>Annuler</button>
              <button className="btn-danger flex-1" onClick={() => deleteIntervention(confirmDelete)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
