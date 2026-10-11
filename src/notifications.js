import { deleteDoc, doc, setDoc } from 'firebase/firestore'
import { firestoreDb } from './firebase'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

async function getMessagingModule() {
  const mod = await import('firebase/messaging')
  if (!(await mod.isSupported())) return null
  return mod
}

export async function isPushSupported() {
  if (!VAPID_KEY || !('Notification' in window) || !('serviceWorker' in navigator)) return false
  return (await getMessagingModule()) !== null
}

async function getCurrentToken(mod) {
  const { getApp } = await import('firebase/app')
  const registration = await navigator.serviceWorker.ready
  return mod.getToken(mod.getMessaging(getApp()), {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  })
}

export async function isPushEnabled() {
  if (!(await isPushSupported()) || Notification.permission !== 'granted') return false
  const token = await getCurrentToken(await getMessagingModule()).catch(() => null)
  return Boolean(token)
}

export async function enablePush(uid) {
  const mod = await getMessagingModule()
  if (!mod) throw new Error('unsupported')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('denied')
  const token = await getCurrentToken(mod)
  await setDoc(doc(firestoreDb, `users/${uid}/fcmTokens`, token), {
    createdAt: Date.now(),
    userAgent: navigator.userAgent,
  })
}

export async function disablePush(uid) {
  const mod = await getMessagingModule()
  if (!mod) return
  const { getApp } = await import('firebase/app')
  const token = await getCurrentToken(mod).catch(() => null)
  if (token) await deleteDoc(doc(firestoreDb, `users/${uid}/fcmTokens`, token))
  await mod.deleteToken(mod.getMessaging(getApp())).catch(() => {})
}
