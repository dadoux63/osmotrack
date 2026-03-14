import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, AlertTriangle, Info } from 'lucide-react'
import { addDoc, collection } from 'firebase/firestore'
import { firestoreDb } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { getReadingStatus, todayISO } from '../utils/maintenance'
import StatusBadge from '../components/StatusBadge'

function calcRejection(tdsIn, tdsOut) {
  if (!tdsIn || !tdsOut || tdsIn === 0) return null
  return Math.round(((tdsIn - tdsOut) / tdsIn) * 1000) / 10
}

export default function NewReading() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [form, setForm] = useState({
    date: todayISO(),
    tdsIn: '',
    tdsOut: '',
    flow: '',
    nitrates: '',
    notes: '',
  })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const rejectionRate = calcRejection(Number(form.tdsIn), Number(form.tdsOut))
  const readingStatus = rejectionRate !== null
    ? getReadingStatus(Number(form.tdsOut), rejectionRate)
    : null

  function set(field) {
    return (e) => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.tdsIn || !form.tdsOut) {
      setError('Les valeurs TDS entrée et sortie sont requises.')
      return
    }

    try {
      await addDoc(collection(firestoreDb, `users/${currentUser.uid}/readings`), {
        date: form.date,
        tdsIn: Number(form.tdsIn),
        tdsOut: Number(form.tdsOut),
        rejectionRate: rejectionRate,
        flow: form.flow ? Number(form.flow) : null,
        nitrates: form.nitrates ? Number(form.nitrates) : null,
        notes: form.notes,
        status: readingStatus,
      })
      setSaved(true)
      setTimeout(() => navigate('/dashboard'), 1600)
    } catch {
      setError('Erreur lors de la sauvegarde. Réessayez.')
    }
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 gap-4">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
          <CheckCircle size={32} className="text-emerald-600" />
        </div>
        <p className="text-lg font-bold text-brand-dark font-serif">Relevé enregistré</p>
        <p className="text-sm text-stone-500">Redirection vers le tableau de bord…</p>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-lg mx-auto">
      <div className="hidden lg:block mb-6">
        <h1 className="page-title">Nouveau relevé</h1>
        <p className="text-sm text-stone-500 mt-0.5">Saisir une mesure TDS</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Preview résultat */}
        {rejectionRate !== null && (
          <div className="card border-l-4 border-l-brand bg-brand-pale/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-stone-500 uppercase tracking-wider">Taux de rejet calculé</p>
                <p className="text-3xl font-bold text-brand-dark mt-0.5">
                  {rejectionRate} <span className="text-sm font-normal text-stone-500">%</span>
                </p>
              </div>
              <div className="text-right">
                {readingStatus && <StatusBadge status={readingStatus} size="lg" />}
                {rejectionRate < 75 && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1 justify-end">
                    <AlertTriangle size={11} /> Rejet insuffisant
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Date */}
        <div>
          <label className="label">Date du relevé</label>
          <input type="date" className="input-field" value={form.date} onChange={set('date')} required />
        </div>

        {/* TDS */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">TDS entrée <span className="normal-case font-normal">(ppm)</span></label>
            <input
              type="number" min="0" step="1"
              className="input-field"
              placeholder="ex : 280"
              value={form.tdsIn} onChange={set('tdsIn')} required
            />
          </div>
          <div>
            <label className="label">TDS sortie <span className="normal-case font-normal">(ppm)</span></label>
            <input
              type="number" min="0" step="1"
              className="input-field"
              placeholder="ex : 14"
              value={form.tdsOut} onChange={set('tdsOut')} required
            />
          </div>
        </div>

        {/* Seuils indicatifs */}
        <div className="bg-stone-50 rounded-lg p-3 text-xs text-stone-500 flex gap-4">
          <Info size={13} className="flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p><span className="text-emerald-600 font-semibold">Optimal</span> — rejet ≥ 85% · TDS sortie ≤ 30 ppm</p>
            <p><span className="text-brand font-semibold">Acceptable</span> — rejet 75–85% · TDS ≤ 50 ppm</p>
            <p><span className="text-amber-600 font-semibold">Dégradé</span> — rejet &lt; 75% · TDS &gt; 50 ppm</p>
            <p><span className="text-red-600 font-semibold">Critique</span> — rejet &lt; 60% · TDS &gt; 100 ppm</p>
          </div>
        </div>

        {/* Optionnel */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Débit <span className="normal-case font-normal">(L/h)</span></label>
            <input
              type="number" min="0" step="0.1"
              className="input-field"
              placeholder="optionnel"
              value={form.flow} onChange={set('flow')}
            />
          </div>
          <div>
            <label className="label">Nitrates sortie <span className="normal-case font-normal">(mg/L)</span></label>
            <input
              type="number" min="0" step="0.1"
              className="input-field"
              placeholder="optionnel"
              value={form.nitrates} onChange={set('nitrates')}
            />
          </div>
        </div>

        {/* Remarques */}
        <div>
          <label className="label">Remarques</label>
          <textarea
            className="input-field resize-none"
            rows={3}
            placeholder="Observations, interventions récentes…"
            value={form.notes} onChange={set('notes')}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1.5">
            <AlertTriangle size={14} /> {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">
            Annuler
          </button>
          <button type="submit" className="btn-primary flex-1">
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  )
}
