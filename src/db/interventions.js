import { collection, doc, increment, writeBatch } from 'firebase/firestore'
import { firestoreDb } from '../firebase'

function roundCents(n) {
  return Math.round(n * 100) / 100
}

function assertStockStays(stockById, deltas) {
  for (const [stockId, delta] of deltas) {
    const stock = stockById.get(stockId)
    if (stock.currentQty + delta < 0) {
      throw new Error(`Stock insuffisant pour « ${stock.name} » (${stock.currentQty} en stock).`)
    }
  }
}

/**
 * Crée ou met à jour une intervention et, si elle est liée à un article, met à
 * jour le stock et le journal des mouvements dans un seul lot d'écriture.
 * La quantité liée est signée : positive pour un achat (entrée en stock),
 * négative pour une consommation (sortie de stock).
 * Le mouvement a le même identifiant que l'intervention : il reste donc
 * toujours synchronisé avec elle.
 *
 * @param {string} uid
 * @param {object} args
 * @param {string} [args.id]       Identifiant de l'intervention (absent à la création)
 * @param {object} args.values     date, category, equipment, description, supplier, technician, cost, notes
 * @param {{stockId:string, qty:number}|null} args.link  Article lié et quantité signée
 * @param {object|null} args.previous  Intervention avant modification
 * @param {object[]} args.stocks   Articles de stock existants
 * @param {(batch:object)=>void} [args.extra]  Écritures supplémentaires dans le même lot
 */
export async function saveIntervention(uid, { id, values, link, previous, stocks, extra }) {
  const base = `users/${uid}`
  const batch = writeBatch(firestoreDb)
  const ref = id
    ? doc(firestoreDb, `${base}/interventions`, id)
    : doc(collection(firestoreDb, `${base}/interventions`))
  const movementRef = doc(firestoreDb, `${base}/stockMovements`, ref.id)
  const stockById = new Map(stocks.map((s) => [s.id, s]))

  const newLink = link && stockById.has(link.stockId) ? link : null
  const oldLink = previous?.stockId && stockById.has(previous.stockId)
    ? { stockId: previous.stockId, qty: previous.stockQty ?? 0 }
    : null

  const deltas = new Map()
  if (oldLink) deltas.set(oldLink.stockId, -oldLink.qty)
  if (newLink) deltas.set(newLink.stockId, (deltas.get(newLink.stockId) ?? 0) + newLink.qty)
  assertStockStays(stockById, deltas)

  batch.set(
    ref,
    { ...values, stockId: newLink?.stockId ?? null, stockQty: newLink?.qty ?? null },
    { merge: true },
  )

  for (const [stockId, delta] of deltas) {
    const update = {}
    if (delta !== 0) update.currentQty = increment(delta)
    const purchaseChanged =
      !previous ||
      previous.stockId !== newLink?.stockId ||
      previous.stockQty !== newLink?.qty ||
      previous.cost !== values.cost
    if (newLink && stockId === newLink.stockId && newLink.qty > 0 && purchaseChanged && values.cost > 0) {
      update.unitPrice = roundCents(values.cost / newLink.qty)
    }
    if (Object.keys(update).length > 0) {
      batch.update(doc(firestoreDb, `${base}/stocks`, stockId), update)
    }
  }

  if (newLink) {
    batch.set(movementRef, {
      stockId: newLink.stockId,
      stockName: stockById.get(newLink.stockId).name,
      qty: newLink.qty,
      type: newLink.qty > 0 ? 'achat' : 'utilisation',
      date: values.date,
      label: values.description,
      interventionId: ref.id,
      createdAt: Date.now(),
    })
  } else if (previous?.stockId) {
    batch.delete(movementRef)
  }

  if (extra) extra(batch)
  await batch.commit()
}

/**
 * Supprime une intervention. Si elle était liée à un article, l'effet sur le
 * stock est annulé et le mouvement correspondant est retiré du journal.
 */
export async function removeIntervention(uid, item, stocks) {
  const base = `users/${uid}`
  const batch = writeBatch(firestoreDb)
  const stockById = new Map(stocks.map((s) => [s.id, s]))
  batch.delete(doc(firestoreDb, `${base}/interventions`, item.id))

  if (item.stockId) {
    if (stockById.has(item.stockId) && item.stockQty) {
      assertStockStays(stockById, new Map([[item.stockId, -item.stockQty]]))
      batch.update(doc(firestoreDb, `${base}/stocks`, item.stockId), {
        currentQty: increment(-item.stockQty),
      })
    }
    batch.delete(doc(firestoreDb, `${base}/stockMovements`, item.id))
  }

  await batch.commit()
}
