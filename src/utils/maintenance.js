/**
 * Calcule le statut d'un équipement de maintenance.
 * @param {string|null} lastDate  — Date ISO de la dernière intervention
 * @param {number} intervalDays  — Intervalle en jours
 * @param {Date} [today]         — Date de référence (défaut: maintenant)
 * @returns {{ status: string, daysRemaining: number|null, nextDate: Date|null, pct: number }}
 */
export function getMaintenanceStatus(lastDate, intervalDays, today = new Date()) {
  if (!lastDate) {
    return { status: 'RETARD', daysRemaining: null, nextDate: null, pct: 0 }
  }

  const last = new Date(lastDate)
  const next = new Date(last.getTime() + intervalDays * 24 * 60 * 60 * 1000)
  const msRemaining = next.getTime() - today.getTime()
  const daysRemaining = Math.round(msRemaining / (24 * 60 * 60 * 1000))
  const pct = Math.max(0, Math.min(100, (daysRemaining / intervalDays) * 100))

  let status
  if (daysRemaining < 0) {
    status = 'URGENT'
  } else if (daysRemaining <= 14) {
    status = 'URGENT'
  } else if (daysRemaining <= 60) {
    status = 'BIENTÔT'
  } else {
    status = 'OK'
  }

  return { status, daysRemaining, nextDate: next, pct }
}

/**
 * Formate une date ISO en format français court (jj/mm/aaaa)
 */
export function formatDate(isoString) {
  if (!isoString) return '—'
  const [y, m, d] = isoString.split('-')
  return `${d}/${m}/${y}`
}

/**
 * Formate une date ISO en format français long
 */
export function formatDateLong(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Retourne la date du jour au format ISO (YYYY-MM-DD)
 */
export function todayISO() {
  return new Date().toISOString().split('T')[0]
}

/**
 * Calcule le statut d'un stock
 */
export function getStockStatus(currentQty, minQty) {
  if (currentQty === 0) return 'COMMANDER'
  if (currentQty < minQty) return 'COMMANDER'
  if (currentQty === minQty) return 'FAIBLE'
  return 'OK'
}

/**
 * Calcule le statut d'un relevé TDS
 */
export function getReadingStatus(tdsOut, rejectionRate) {
  if (rejectionRate < 60 || tdsOut > 100) return 'critique'
  if (rejectionRate < 75 || tdsOut > 50) return 'dégradé'
  if (rejectionRate < 85) return 'acceptable'
  return 'optimal'
}

/**
 * Labels et couleurs des statuts
 */
export const STATUS_CONFIG = {
  URGENT: { label: 'URGENT', className: 'badge-urgent', color: '#dc2626' },
  BIENTÔT: { label: 'BIENTÔT', className: 'badge-bientot', color: '#d97706' },
  OK: { label: 'OK', className: 'badge-ok', color: '#16a34a' },
  RETARD: { label: 'EN RETARD', className: 'badge-urgent', color: '#dc2626' },
  COMMANDER: { label: 'COMMANDER', className: 'badge-urgent', color: '#dc2626' },
  FAIBLE: { label: 'FAIBLE', className: 'badge-bientot', color: '#d97706' },
  optimal: { label: 'Optimal', className: 'badge-ok', color: '#16a34a' },
  acceptable: { label: 'Acceptable', className: 'badge-info', color: '#185FA5' },
  dégradé: { label: 'Dégradé', className: 'badge-bientot', color: '#d97706' },
  critique: { label: 'Critique', className: 'badge-urgent', color: '#dc2626' },
}

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['OK']
  return config
}
