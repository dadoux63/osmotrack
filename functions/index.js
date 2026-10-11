import { onSchedule } from 'firebase-functions/v2/scheduler'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

initializeApp()

const DAY_MS = 24 * 60 * 60 * 1000
const URGENT_WITHIN_DAYS = 14
// Garde-fou : jamais plus d'une notification par période, même si la fonction est relancée
const MIN_DAYS_BETWEEN_SENDS = 6
const STALE_TOKEN_CODES = [
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]

function maintenanceLabel(m, now) {
  if (!m.lastDate) return `${m.equipment} (jamais fait)`
  const next = new Date(m.lastDate).getTime() + m.intervalDays * DAY_MS
  const days = Math.round((next - now) / DAY_MS)
  if (days > URGENT_WITHIN_DAYS) return null
  return days < 0 ? `${m.equipment} (retard ${-days} j)` : `${m.equipment} (dans ${days} j)`
}

function needsOrder(s) {
  return s.currentQty === 0 || s.currentQty < s.minQty
}

function summarize(names, max = 3) {
  const shown = names.slice(0, max).join(', ')
  return names.length > max ? `${shown} +${names.length - max}` : shown
}

async function buildMessage(db, uid, now) {
  const [maintSnap, stocksSnap] = await Promise.all([
    db.collection(`users/${uid}/maintenance`).get(),
    db.collection(`users/${uid}/stocks`).get(),
  ])

  const tasks = maintSnap.docs
    .map((d) => maintenanceLabel(d.data(), now))
    .filter(Boolean)
  const orders = stocksSnap.docs
    .map((d) => d.data())
    .filter(needsOrder)
    .map((s) => s.name)

  if (tasks.length === 0 && orders.length === 0) return null

  const parts = []
  if (tasks.length) parts.push(`À faire : ${summarize(tasks)}`)
  if (orders.length) parts.push(`À commander : ${summarize(orders)}`)

  return {
    title: 'OsmoTrack — rappels de la semaine',
    body: parts.join('. '),
    route: tasks.length ? '/maintenance' : '/stocks',
  }
}

export const weeklyReminder = onSchedule(
  {
    schedule: '0 8 * * 1', // chaque lundi à 8h
    timeZone: 'Europe/Paris',
    region: 'europe-west1',
    retryCount: 0,
  },
  async () => {
    const db = getFirestore()
    const messaging = getMessaging()
    const now = Date.now()

    const tokenDocs = await db.collectionGroup('fcmTokens').get()
    const tokensByUid = new Map()
    tokenDocs.forEach((d) => {
      const uid = d.ref.parent.parent.id
      if (!tokensByUid.has(uid)) tokensByUid.set(uid, [])
      tokensByUid.get(uid).push({ token: d.id, ref: d.ref })
    })

    for (const [uid, entries] of tokensByUid) {
      const metaRef = db.doc(`users/${uid}/meta/notifications`)
      const meta = await metaRef.get()
      const lastSentAt = meta.exists ? meta.data().lastSentAt : 0
      if (now - lastSentAt < MIN_DAYS_BETWEEN_SENDS * DAY_MS) continue

      const message = await buildMessage(db, uid, now)
      if (!message) continue

      const res = await messaging.sendEachForMulticast({
        tokens: entries.map((e) => e.token),
        data: message,
        webpush: { headers: { TTL: String(3 * DAY_MS / 1000) } },
      })

      await Promise.all(
        res.responses.map((r, i) =>
          !r.success && STALE_TOKEN_CODES.includes(r.error?.code)
            ? entries[i].ref.delete()
            : null
        )
      )

      if (res.successCount > 0) await metaRef.set({ lastSentAt: now })
    }
  }
)
