import { useState } from 'react'
import { updateDoc, addDoc, collection, doc } from 'firebase/firestore'
import { Plus, Minus, ShoppingCart, Package } from 'lucide-react'
import { firestoreDb } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useCollection } from '../hooks/useFirestore'
import StatusBadge from '../components/StatusBadge'
import { getStockStatus } from '../utils/maintenance'

const CATEGORIES = ['Tous', 'Filtres entrée', 'Adoucisseur', 'Lampe UV', 'Osmoseur']

function StockItem({ item, uid }) {
  const status = getStockStatus(item.currentQty, item.minQty)

  async function adjustQty(delta) {
    const newQty = Math.max(0, item.currentQty + delta)
    await updateDoc(doc(firestoreDb, `users/${uid}/stocks`, item.id), { currentQty: newQty })
  }

  return (
    <div className={`card ${status === 'COMMANDER' ? 'border-l-4 border-l-red-400' : status === 'FAIBLE' ? 'border-l-4 border-l-amber-400' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="font-semibold text-brand-dark text-sm">{item.name}</p>
            <StatusBadge status={status} />
          </div>
          <p className="text-xs text-stone-400">{item.category}</p>
          {item.supplier && (
            <p className="text-xs text-stone-400 mt-0.5">
              {item.supplier} · {item.unitPrice?.toFixed(2)} €/unité
            </p>
          )}
          {item.notes && (
            <p className="text-xs text-stone-400 mt-1 italic line-clamp-1">{item.notes}</p>
          )}
        </div>

        {/* Quantity control */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => adjustQty(-1)}
              disabled={item.currentQty === 0}
              className="w-7 h-7 rounded-full border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Minus size={12} />
            </button>
            <span className="text-lg font-bold text-brand-dark w-6 text-center">{item.currentQty}</span>
            <button
              onClick={() => adjustQty(1)}
              className="w-7 h-7 rounded-full border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100 transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>
          <p className="text-xs text-stone-400">min. {item.minQty} {item.unit}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            status === 'COMMANDER' ? 'bg-red-400' :
            status === 'FAIBLE' ? 'bg-amber-400' : 'bg-emerald-400'
          }`}
          style={{ width: `${Math.min(100, (item.currentQty / Math.max(item.minQty * 2, 1)) * 100)}%` }}
        />
      </div>
    </div>
  )
}

function AddStockModal({ uid, onClose }) {
  const [form, setForm] = useState({
    name: '', category: 'Osmoseur', currentQty: '', minQty: '',
    unit: 'pièce', supplier: '', unitPrice: '', notes: '',
  })

  function set(f) { return e => setForm(p => ({ ...p, [f]: e.target.value })) }

  async function handleAdd(e) {
    e.preventDefault()
    await addDoc(collection(firestoreDb, `users/${uid}/stocks`), {
      name: form.name,
      category: form.category,
      currentQty: Number(form.currentQty),
      minQty: Number(form.minQty),
      unit: form.unit,
      supplier: form.supplier,
      unitPrice: form.unitPrice ? Number(form.unitPrice) : 0,
      supplierUrl: '',
      notes: form.notes,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-brand-dark/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-stone-100">
          <h3 className="font-bold text-brand-dark font-serif">Nouveau consommable</h3>
        </div>
        <form onSubmit={handleAdd} className="p-5 space-y-3">
          <div>
            <label className="label">Nom</label>
            <input className="input-field" required value={form.name} onChange={set('name')} placeholder="ex : Membrane RO 50 GPD" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Catégorie</label>
              <select className="input-field" value={form.category} onChange={set('category')}>
                {CATEGORIES.filter(c => c !== 'Tous').map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Unité</label>
              <input className="input-field" value={form.unit} onChange={set('unit')} placeholder="pièce" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Stock actuel</label>
              <input type="number" min="0" className="input-field" required value={form.currentQty} onChange={set('currentQty')} />
            </div>
            <div>
              <label className="label">Stock minimum</label>
              <input type="number" min="0" className="input-field" required value={form.minQty} onChange={set('minQty')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Fournisseur</label>
              <input className="input-field" value={form.supplier} onChange={set('supplier')} />
            </div>
            <div>
              <label className="label">Prix unitaire (€)</label>
              <input type="number" min="0" step="0.01" className="input-field" value={form.unitPrice} onChange={set('unitPrice')} />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary flex-1">Ajouter</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Stocks() {
  const [activeCategory, setActiveCategory] = useState('Tous')
  const [showAdd, setShowAdd] = useState(false)
  const { currentUser } = useAuth()
  const uid = currentUser?.uid

  const stocks = useCollection(uid ? `users/${uid}/stocks` : null)

  const filtered = stocks
    ?.filter(s => activeCategory === 'Tous' || s.category === activeCategory)
    .sort((a, b) => {
      const order = { COMMANDER: 0, FAIBLE: 1, OK: 2 }
      return (order[getStockStatus(a.currentQty, a.minQty)] ?? 2) - (order[getStockStatus(b.currentQty, b.minQty)] ?? 2)
    })
    ?? []

  const toOrder = stocks?.filter(s => getStockStatus(s.currentQty, s.minQty) === 'COMMANDER') ?? []
  const orderTotal = toOrder.reduce((s, i) => s + (i.unitPrice || 0), 0)

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <div className="hidden lg:block mb-6">
        <h1 className="page-title">Stocks consommables</h1>
        <p className="text-sm text-stone-500 mt-0.5">{toOrder.length} article(s) à commander</p>
      </div>

      {/* Résumé à commander */}
      {toOrder.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart size={15} className="text-red-600" />
            <p className="font-bold text-red-700 text-sm">À commander maintenant</p>
          </div>
          <div className="space-y-1">
            {toOrder.map(s => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span className="text-red-800">{s.name}</span>
                <span className="text-red-600 font-medium">{s.unitPrice?.toFixed(2)} €</span>
              </div>
            ))}
            <div className="flex justify-between pt-1 border-t border-red-200 mt-2 font-bold text-red-700 text-sm">
              <span>Total estimé</span>
              <span>{orderTotal.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
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
        {filtered.map(item => <StockItem key={item.id} item={item} uid={uid} />)}
        {filtered.length === 0 && (
          <div className="text-center py-10">
            <Package size={32} className="text-stone-200 mx-auto mb-2" />
            <p className="text-stone-400 text-sm">Aucun article</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 lg:bottom-6 right-4 lg:right-6 w-12 h-12 bg-brand text-white rounded-full shadow-lg flex items-center justify-center hover:bg-brand-light transition-colors z-40"
      >
        <Plus size={22} />
      </button>

      {showAdd && <AddStockModal uid={uid} onClose={() => setShowAdd(false)} />}
    </div>
  )
}
