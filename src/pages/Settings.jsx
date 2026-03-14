import { useState, useEffect } from 'react'
import { doc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore'
import { Save, RefreshCw, AlertTriangle, Droplets, Beaker, ShieldAlert } from 'lucide-react'
import { firestoreDb } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useDocument } from '../hooks/useFirestore'
import { seedDatabase } from '../db/seedData'

function Section({ title, icon: Icon, children }) {
  return (
    <div className="card-lg">
      <div className="flex items-center gap-2 mb-5">
        {Icon && <Icon size={16} className="text-brand" />}
        <h2 className="font-bold text-brand-dark font-serif">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function SettingRow({ label, desc, settingKey, unit, type = 'number', min, step = '1' }) {
  const { currentUser } = useAuth()
  const uid = currentUser?.uid
  const setting = useDocument(uid ? `users/${uid}/settings` : null, settingKey)
  const [val, setVal] = useState('')

  useEffect(() => {
    if (setting !== undefined) setVal(setting?.value ?? '')
  }, [setting])

  async function save() {
    if (!uid) return
    await setDoc(doc(firestoreDb, `users/${uid}/settings`, settingKey), {
      value: type === 'number' ? Number(val) : val,
    })
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-brand-dark">{label}</p>
        {desc && <p className="text-xs text-stone-400 mt-0.5">{desc}</p>}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <input
          type={type}
          min={min}
          step={step}
          value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={save}
          className="w-20 border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm text-center bg-white focus:outline-none focus:ring-2 focus:ring-brand"
        />
        {unit && <span className="text-xs text-stone-400 w-10">{unit}</span>}
      </div>
    </div>
  )
}

export default function Settings() {
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const { currentUser } = useAuth()
  const uid = currentUser?.uid

  const waterSourceFields = [
    { key: 'waterSourceTH', label: 'Dureté (TH)', unit: '°f' },
    { key: 'waterSourceNitrates', label: 'Nitrates', unit: 'mg/L' },
    { key: 'waterSourceConductivity', label: 'Conductivité', unit: 'µS/cm' },
    { key: 'waterSourceCOT', label: 'COT', unit: 'mg/L', step: '0.01' },
  ]

  async function handleReset() {
    if (!uid) return
    const colls = ['readings', 'interventions', 'maintenance', 'stocks', 'settings']
    for (const c of colls) {
      const snap = await getDocs(collection(firestoreDb, `users/${uid}/${c}`))
      if (snap.size > 0) {
        const batch = writeBatch(firestoreDb)
        snap.docs.forEach(d => batch.delete(d.ref))
        await batch.commit()
      }
    }
    await seedDatabase(uid)
    setConfirmReset(false)
    setResetDone(true)
    setTimeout(() => setResetDone(false), 3000)
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-5">
      <div className="hidden lg:block mb-6">
        <h1 className="page-title">Paramètres</h1>
        <p className="text-sm text-stone-500 mt-0.5">Configuration du système et des seuils d'alerte</p>
      </div>

      {/* Seuils d'alerte TDS */}
      <Section title="Seuils d'alerte TDS" icon={ShieldAlert}>
        <SettingRow
          label="TDS sortie maximum"
          desc="Alerte orange si dépassé"
          settingKey="alertTdsOut"
          unit="ppm"
          min="0"
        />
        <SettingRow
          label="Taux de rejet minimum"
          desc="Alerte rouge en dessous"
          settingKey="alertRejectionMin"
          unit="%"
          min="0" step="1"
        />
        <SettingRow
          label="Nitrates sortie maximum"
          desc="Alerte critique si dépassé"
          settingKey="alertNitratesOut"
          unit="mg/L"
          min="0" step="0.1"
        />
      </Section>

      {/* Seuils filtres */}
      <Section title="Alertes durée de vie filtres" icon={AlertTriangle}>
        <SettingRow
          label="Seuil alerte orange"
          desc="Rappel quand X% de vie restante"
          settingKey="alertFilterPctOrange"
          unit="% restant"
          min="0" step="5"
        />
        <SettingRow
          label="Seuil alerte rouge"
          desc="Urgence quand X% de vie restante"
          settingKey="alertFilterPctRed"
          unit="% restant"
          min="0" step="5"
        />
      </Section>

      {/* Budget */}
      <Section title="Budget annuel" icon={null}>
        <SettingRow
          label="Budget annuel estimé"
          desc="Référence pour le suivi des coûts"
          settingKey="annualBudget"
          unit="€ / an"
          min="0" step="10"
        />
      </Section>

      {/* Analyse eau source */}
      <Section title="Analyse eau de source" icon={Droplets}>
        <p className="text-xs text-stone-400 -mt-2">
          Dernière analyse laboratoire : 02/04/2024
        </p>
        {waterSourceFields.map(f => (
          <SettingRow
            key={f.key}
            label={f.label}
            settingKey={f.key}
            unit={f.unit}
            min="0"
            step={f.step || '0.1'}
          />
        ))}
      </Section>

      {/* Info système */}
      <Section title="Système de traitement" icon={Beaker}>
        <div className="space-y-2 text-sm text-stone-600">
          {[
            ['Source', 'Puits privé'],
            ['Étape 1', 'Filtres avant adoucisseur (sédiments 25µ + charbon)'],
            ['Étape 2', 'Adoucisseur à résine (Laugil)'],
            ['Étape 3', 'Lampe UV Laugil (Philips 30W G30 T8)'],
            ['Étape 4', 'Osmoseur Water Light 3 étapes'],
            ['Membrane', 'TFC 1812-50 GPD Hidrotek'],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="font-semibold text-brand-dark w-20 flex-shrink-0">{k}</span>
              <span className="text-stone-500">{v}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Réinitialisation */}
      <div className="card-lg border border-red-100">
        <h2 className="font-bold text-red-700 font-serif mb-2 flex items-center gap-2">
          <RefreshCw size={15} /> Réinitialiser les données
        </h2>
        <p className="text-sm text-stone-500 mb-4">
          Recharge toutes les données d'exemple depuis zéro. Les saisies manuelles seront perdues.
        </p>
        <button
          onClick={() => setConfirmReset(true)}
          className="btn-danger w-full"
        >
          Réinitialiser
        </button>
      </div>

      {/* Confirm reset */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5">
            <p className="font-bold text-brand-dark mb-2">Réinitialiser toutes les données ?</p>
            <p className="text-sm text-stone-500 mb-5">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setConfirmReset(false)}>Annuler</button>
              <button className="btn-danger flex-1" onClick={handleReset}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {resetDone && (
        <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-2.5 rounded-full shadow-lg text-sm font-medium z-50">
          Données réinitialisées ✓
        </div>
      )}

      <p className="text-center text-xs text-stone-300 pb-4">
        OsmoTrack v1.0.0 — Données synchronisées via Firebase
      </p>
    </div>
  )
}
