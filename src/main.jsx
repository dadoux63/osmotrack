import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Detect missing Firebase config (GitHub secrets not set)
const requiredEnv = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
]
const missingEnv = requiredEnv.filter(k => !import.meta.env[k])
if (missingEnv.length > 0) {
  document.getElementById('root').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;padding:2rem;text-align:center;">
      <div>
        <h2 style="color:#185FA5;margin-bottom:1rem">OsmoTrack — Configuration manquante</h2>
        <p style="color:#666">Variables Firebase non définies : ${missingEnv.join(', ')}</p>
        <p style="color:#999;margin-top:.5rem;font-size:.875rem">Vérifiez les secrets GitHub Actions (Settings → Secrets → Actions)</p>
      </div>
    </div>`
  throw new Error('Missing Firebase config: ' + missingEnv.join(', '))
}

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = import.meta.env.BASE_URL + 'sw.js'
    navigator.serviceWorker
      .register(swUrl)
      .catch((err) => console.warn('SW registration failed:', err))
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
