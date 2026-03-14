import { collection, doc, getDocs, limit, query, writeBatch } from 'firebase/firestore'
import { firestoreDb } from '../firebase'

async function isSeeded(uid) {
  const snap = await getDocs(
    query(collection(firestoreDb, `users/${uid}/settings`), limit(1))
  )
  return !snap.empty
}

export async function seedDatabase(uid) {
  if (await isSeeded(uid)) return

  const userPath = `users/${uid}`
  const batch = writeBatch(firestoreDb)

  // ── Relevés TDS ──────────────────────────────────────────────
  const readingsData = [
    { date: '2025-10-31', tdsIn: 285, tdsOut: 123, rejectionRate: 56.8, flow: null, nitrates: null, notes: 'Membrane à remplacer — taux de rejet critique', status: 'critique' },
    { date: '2025-11-05', tdsIn: 284, tdsOut: 13,  rejectionRate: 95.4, flow: null, nitrates: null, notes: 'Membrane neuve TFC 1812-50 GPD posée — résultat optimal', status: 'optimal' },
    { date: '2025-11-21', tdsIn: 295, tdsOut: 56,  rejectionRate: 81.0, flow: null, nitrates: null, notes: '', status: 'acceptable' },
    { date: '2025-12-22', tdsIn: 271, tdsOut: 71,  rejectionRate: 73.8, flow: null, nitrates: null, notes: '', status: 'dégradé' },
  ]
  readingsData.forEach((r) => {
    batch.set(doc(collection(firestoreDb, `${userPath}/readings`)), r)
  })

  // ── Interventions ─────────────────────────────────────────────
  const interventionsData = [
    { date: '2024-03-26', equipment: 'Osmoseur',       category: 'filtre',      description: 'Remplacement préfiltre sédiments 5µ',              supplier: 'Laugil',    cost: 0,    technician: 'Laugil',       notes: 'Intervention Laugil — contrat entretien' },
    { date: '2024-03-26', equipment: 'Osmoseur',       category: 'filtre',      description: 'Remplacement préfiltre charbon GAC',               supplier: 'Laugil',    cost: 0,    technician: 'Laugil',       notes: '' },
    { date: '2024-03-26', equipment: 'Osmoseur',       category: 'filtre',      description: 'Remplacement post-filtre charbon',                 supplier: 'Laugil',    cost: 0,    technician: 'Laugil',       notes: '' },
    { date: '2024-11-12', equipment: 'Adoucisseur',    category: 'adoucisseur', description: 'Désinfection résine adoucisseur',                  supplier: 'Laugil',    cost: 155,  technician: 'Laugil',       notes: 'Intervention complète résine + recharge sel' },
    { date: '2024-11-12', equipment: 'Filtres entrée', category: 'filtre',      description: 'Remplacement filtre bobine sédiments',             supplier: 'Laugil',    cost: 0,    technician: 'Laugil',       notes: '' },
    { date: '2024-11-12', equipment: 'Filtres entrée', category: 'filtre',      description: 'Remplacement filtre GAC (charbon actif)',           supplier: 'Laugil',    cost: 0,    technician: 'Laugil',       notes: '' },
    { date: '2025-10-29', equipment: 'Général',        category: 'achat',       description: 'Achat TDS-mètre numérique',                        supplier: 'Josmose',   cost: 9.9,  technician: 'Propriétaire', notes: '' },
    { date: '2025-10-29', equipment: 'Osmoseur',       category: 'achat',       description: 'Achat post-filtre charbon (stock)',                 supplier: 'Josmose',   cost: 14.9, technician: 'Propriétaire', notes: '' },
    { date: '2025-10-29', equipment: 'Filtres entrée', category: 'achat',       description: 'Achat filtre sédiments PS 5µ (stock)',              supplier: 'Josmose',   cost: 15.8, technician: 'Propriétaire', notes: '' },
    { date: '2025-10-29', equipment: 'Osmoseur',       category: 'achat',       description: 'Achat préfiltre PP 1µ (stock)',                     supplier: 'Josmose',   cost: 11.8, technician: 'Propriétaire', notes: '' },
    { date: '2025-10-29', equipment: 'Osmoseur',       category: 'achat',       description: 'Achat préfiltre charbon GAC (stock)',               supplier: 'Josmose',   cost: 9.9,  technician: 'Propriétaire', notes: '' },
    { date: '2025-10-29', equipment: 'Filtres entrée', category: 'achat',       description: 'Achat filtre sédiments PP 5µ (stock)',              supplier: 'Josmose',   cost: 11.8, technician: 'Propriétaire', notes: '' },
    { date: '2025-10-31', equipment: 'Osmoseur',       category: 'membrane',    description: 'Remplacement membrane RO — TFC 1812-50 GPD Hidrotek', supplier: 'Josmose', cost: 24.9, technician: 'Propriétaire', notes: 'Ancienne membrane : rejet 56.8% → Nouvelle : 95.4%' },
    { date: '2025-11-04', equipment: 'Lampe UV',       category: 'uv',          description: 'Remplacement lampe UV Philips 30W G30 T8',          supplier: 'kfms.fr',   cost: 27.53,technician: 'Propriétaire', notes: '' },
    { date: '2025-11-04', equipment: 'Filtres entrée', category: 'filtre',      description: 'Remplacement filtre bobine + GAC 25µ (stock Laugil)',supplier: 'Laugil',    cost: 0,    technician: 'Propriétaire', notes: 'Utilisation des cartouches stock Laugil' },
    { date: '2025-11-12', equipment: 'Lampe UV',       category: 'uv',          description: 'Remplacement manchon quartz + lampe UV secours',    supplier: 'koiconnect', cost: 49.9, technician: 'Propriétaire', notes: 'Kit complet quartz + lampe de rechange' },
  ]
  interventionsData.forEach((i) => {
    batch.set(doc(collection(firestoreDb, `${userPath}/interventions`)), i)
  })

  // ── Planning maintenance ──────────────────────────────────────
  const maintenanceData = [
    { equipment: 'Filtres avant adoucisseur',    category: 'Filtres entrée', description: 'Remplacement cartouches sédiments + charbon (avant adoucisseur)', lastDate: '2025-11-03', intervalDays: 180, notes: 'Bobine sédiments 25µ + GAC' },
    { equipment: 'Désinfection résine adoucisseur', category: 'Adoucisseur', description: 'Désinfection et régénération résine adoucisseur',                  lastDate: '2025-11-04', intervalDays: 180, notes: 'Produit IOCLEAN recommandé' },
    { equipment: 'Recharge sel adoucisseur',     category: 'Adoucisseur', description: 'Vérification et recharge sel régénérant',                             lastDate: '2025-10-25', intervalDays: 30,  notes: 'Sel pastilles 25 kg — vérifier niveau bac' },
    { equipment: 'Test TH adoucisseur',          category: 'Adoucisseur', description: 'Mesure dureté eau adoucie (TH sortie)',                                lastDate: null,         intervalDays: 30,  notes: 'TH source 37,3°f — cible < 5°f après adoucissement' },
    { equipment: 'Lampe UV',                     category: 'Lampe UV',    description: 'Remplacement lampe UV Laugil',                                         lastDate: '2025-11-04', intervalDays: 365, notes: 'Philips 30W G30 T8 — durée de vie ~9000h' },
    { equipment: 'Nettoyage manchon quartz UV',  category: 'Lampe UV',    description: 'Nettoyage et vérification manchon quartz',                             lastDate: null,         intervalDays: 30,  notes: 'Désincruster avec solution acide douce si nécessaire' },
    { equipment: 'Préfiltres osmoseur',          category: 'Osmoseur',    description: 'Remplacement préfiltres sédiments + charbon osmoseur',                lastDate: '2025-11-05', intervalDays: 365, notes: 'PP 1µ + GAC — Water Light 3 étapes' },
    { equipment: 'Membrane osmoseur',            category: 'Osmoseur',    description: 'Remplacement membrane RO osmoseur',                                   lastDate: '2025-11-05', intervalDays: 548, notes: 'TFC 1812-50 GPD Hidrotek — surveiller taux rejet' },
    { equipment: 'Post-filtre osmoseur',         category: 'Osmoseur',    description: 'Remplacement post-filtre charbon osmoseur',                           lastDate: '2025-11-12', intervalDays: 365, notes: 'Charbon actif finition' },
    { equipment: 'Analyse eau laboratoire',      category: 'Analyse',     description: 'Analyse complète eau brute + eau traitée en laboratoire agréé',       lastDate: '2024-04-02', intervalDays: 365, notes: 'Paramètres : TH, nitrates, bactériologie, conductivité, COT' },
  ]
  maintenanceData.forEach((m) => {
    batch.set(doc(collection(firestoreDb, `${userPath}/maintenance`)), m)
  })

  // ── Stocks consommables ───────────────────────────────────────
  const stocksData = [
    { name: 'Cartouches sédiments 5µ',          category: 'Filtres entrée', currentQty: 5, minQty: 2, unit: 'pièces', supplier: 'adoucisseur-eau.com', unitPrice: 5.68,  supplierUrl: '', notes: 'Lot de 5 — filtre avant adoucisseur' },
    { name: 'Cartouches sédiments 25µ',          category: 'Filtres entrée', currentQty: 5, minQty: 2, unit: 'pièces', supplier: 'adoucisseur-eau.com', unitPrice: 2.45,  supplierUrl: '', notes: 'Bobine 25µ' },
    { name: 'Sel régénérant 25 kg',              category: 'Adoucisseur',    currentQty: 2, minQty: 1, unit: 'sacs',   supplier: 'Laugil / GSB',        unitPrice: 10.2,  supplierUrl: '', notes: 'Pastilles sel — contrôler niveau mensuel' },
    { name: 'Lampe UV Philips 30W G30 T8',       category: 'Lampe UV',       currentQty: 1, minQty: 1, unit: 'pièce',  supplier: 'kfms.fr',             unitPrice: 27.53, supplierUrl: '', notes: 'Lampe de rechange pour Laugil UV' },
    { name: 'Manchon quartz UV',                 category: 'Lampe UV',       currentQty: 1, minQty: 1, unit: 'pièce',  supplier: 'koiconnect',          unitPrice: 22.0,  supplierUrl: '', notes: 'Gaine quartz Laugil UV' },
    { name: 'Préfiltre sédiments osmoseur PP',   category: 'Osmoseur',       currentQty: 1, minQty: 2, unit: 'pièces', supplier: 'Josmose',             unitPrice: 5.9,   supplierUrl: '', notes: 'PP 1µ Water Light — à commander' },
    { name: 'Préfiltre charbon osmoseur GAC',    category: 'Osmoseur',       currentQty: 1, minQty: 2, unit: 'pièces', supplier: 'Josmose',             unitPrice: 9.9,   supplierUrl: '', notes: 'GAC Water Light — à commander' },
    { name: 'Post-filtre charbon osmoseur',      category: 'Osmoseur',       currentQty: 1, minQty: 1, unit: 'pièce',  supplier: 'Josmose',             unitPrice: 15.9,  supplierUrl: '', notes: 'Charbon actif finition — stock faible' },
    { name: 'Membrane RO TFC 1812-50 GPD',       category: 'Osmoseur',       currentQty: 0, minQty: 1, unit: 'pièce',  supplier: 'Josmose',             unitPrice: 24.9,  supplierUrl: '', notes: 'Hidrotek — COMMANDER maintenant' },
    { name: 'Nettoyant résine IOCLEAN',          category: 'Adoucisseur',    currentQty: 0, minQty: 1, unit: 'flacon', supplier: 'Amazon',              unitPrice: 5.0,   supplierUrl: '', notes: 'Désinfectant résine — COMMANDER' },
  ]
  stocksData.forEach((s) => {
    batch.set(doc(collection(firestoreDb, `${userPath}/stocks`)), s)
  })

  // ── Paramètres par défaut ─────────────────────────────────────
  const settingsData = {
    alertTdsOut:          50,
    alertRejectionMin:    75,
    alertNitratesOut:     10,
    alertFilterPctOrange: 30,
    alertFilterPctRed:    10,
    annualBudget:         479,
    waterSourceTH:        37.3,
    waterSourceNitrates:  30,
    waterSourceConductivity: 717,
    waterSourceCOT:       0.98,
  }
  Object.entries(settingsData).forEach(([key, value]) => {
    batch.set(doc(firestoreDb, `${userPath}/settings`, key), { value })
  })

  await batch.commit()
}
