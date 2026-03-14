import { collection, doc, writeBatch } from 'firebase/firestore'
import { firestoreDb } from '../firebase'
import { db as dexieDb } from './database'

const MIGRATION_KEY = 'osmotrack_migrated'

/**
 * One-time migration from Dexie (IndexedDB) to Firestore.
 * Runs only once per Firebase UID.
 * Copies readings, interventions, maintenance, stocks, and settings.
 */
export async function migrateToFirestore(uid) {
  if (localStorage.getItem(MIGRATION_KEY) === uid) return

  try {
    const [readings, interventions, maintenance, stocks, settings] =
      await Promise.all([
        dexieDb.readings.toArray(),
        dexieDb.interventions.toArray(),
        dexieDb.maintenance.toArray(),
        dexieDb.stocks.toArray(),
        dexieDb.settings.toArray(),
      ])

    // Only migrate if there is local data worth migrating
    const hasData = readings.length + interventions.length + stocks.length > 0
    if (!hasData) {
      localStorage.setItem(MIGRATION_KEY, uid)
      return
    }

    const userPath = `users/${uid}`
    const BATCH_LIMIT = 490 // Firestore batch limit is 500 writes

    async function batchWrite(items, collectionName, toDoc) {
      for (let i = 0; i < items.length; i += BATCH_LIMIT) {
        const batch = writeBatch(firestoreDb)
        items.slice(i, i + BATCH_LIMIT).forEach((item) => {
          const { id, ...data } = item
          const ref = doc(collection(firestoreDb, `${userPath}/${collectionName}`))
          batch.set(ref, toDoc(data))
        })
        await batch.commit()
      }
    }

    const clean = (obj) =>
      Object.fromEntries(
        Object.entries(obj).filter(([, v]) => v !== undefined)
      )

    await batchWrite(readings, 'readings', clean)
    await batchWrite(interventions, 'interventions', clean)
    await batchWrite(maintenance, 'maintenance', clean)
    await batchWrite(stocks, 'stocks', clean)

    // Settings use key as doc ID
    if (settings.length > 0) {
      const batch = writeBatch(firestoreDb)
      settings.forEach(({ key, value }) => {
        const ref = doc(firestoreDb, `${userPath}/settings`, key)
        batch.set(ref, { value })
      })
      await batch.commit()
    }

    localStorage.setItem(MIGRATION_KEY, uid)
    console.log('[OsmoTrack] Données migrées vers Firestore.')
  } catch (err) {
    console.error('[OsmoTrack] Erreur migration Firestore:', err)
  }
}
