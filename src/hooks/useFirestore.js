import { useState, useEffect } from 'react'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import { firestoreDb } from '../firebase'

/**
 * Subscribe to a Firestore collection in real-time.
 * Returns an array of documents with their Firestore ID included as `id`.
 * Returns undefined while loading.
 */
export function useCollection(path) {
  const [data, setData] = useState(undefined)

  useEffect(() => {
    if (!path) return
    const ref = collection(firestoreDb, path)
    const unsubscribe = onSnapshot(
      ref,
      (snap) => { setData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))) },
      (err) => { console.error('[useCollection]', path, err) },
    )
    return unsubscribe
  }, [path])

  return data
}

/**
 * Subscribe to a single Firestore document in real-time.
 * Returns undefined while loading, null if not found.
 */
export function useDocument(path, docId) {
  const [data, setData] = useState(undefined)

  useEffect(() => {
    if (!path || !docId) return
    const ref = doc(firestoreDb, path, docId)
    const unsubscribe = onSnapshot(
      ref,
      (snap) => { setData(snap.exists() ? { id: snap.id, ...snap.data() } : null) },
      (err) => { console.error('[useDocument]', path, docId, err) },
    )
    return unsubscribe
  }, [path, docId])

  return data
}
