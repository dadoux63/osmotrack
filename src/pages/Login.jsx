import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Droplets, User, Mail, Lock, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { collection, getDocs, limit, query } from 'firebase/firestore'
import { firestoreDb } from '../firebase'

export default function Login() {
  const { currentUser, login, register } = useAuth()
  const navigate = useNavigate()

  const [isRegistering, setIsRegistering] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) navigate('/dashboard', { replace: true })
  }, [currentUser, navigate])

  function switchMode(registering) {
    setIsRegistering(registering)
    setError('')
    setDisplayName('')
    setEmail('')
    setPassword('')
    setConfirm('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!email.trim()) { setError("L'adresse email est requise."); return }
    if (password.length < 6) { setError('Le mot de passe doit comporter au moins 6 caractères.'); return }
    if (isRegistering && !displayName.trim()) { setError("Le nom d'utilisateur est requis."); return }
    if (isRegistering && password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }

    setLoading(true)
    try {
      if (isRegistering) {
        await register(displayName.trim(), email.trim(), password)
      } else {
        await login(email.trim(), password)
      }
      // Navigation handled by useEffect watching currentUser
    } catch (err) {
      const msg = {
        'auth/user-not-found':       'Identifiants incorrects.',
        'auth/wrong-password':       'Identifiants incorrects.',
        'auth/invalid-credential':   'Identifiants incorrects.',
        'auth/email-already-in-use': 'Cette adresse email est déjà utilisée.',
        'auth/weak-password':        'Mot de passe trop faible (6 caractères minimum).',
        'auth/invalid-email':        'Adresse email invalide.',
      }[err.code] ?? err.message
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (hasUsers === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-cream">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 bg-brand rounded-2xl flex items-center justify-center shadow-lg">
            <Droplets size={28} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-brand-dark font-serif">OsmoTrack</h1>
            <p className="text-sm text-stone-400 mt-0.5">Eau de puits</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
          <h2 className="text-lg font-semibold text-brand-dark font-serif mb-1">
            {isRegistering ? 'Créer un compte' : 'Connexion'}
          </h2>
          <p className="text-sm text-stone-400 mb-5">
            {isRegistering
              ? 'Première utilisation — créez votre compte.'
              : 'Identifiez-vous pour accéder à vos données.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display name — registration only */}
            {isRegistering && (
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5">Nom d'utilisateur</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition"
                    placeholder="Votre prénom ou pseudo"
                    autoComplete="name"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1.5">Adresse email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition"
                  placeholder="vous@exemple.fr"
                  autoComplete="email"
                  autoFocus={!isRegistering}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition"
                  placeholder="••••••••"
                  autoComplete={isRegistering ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm password — registration only */}
            {isRegistering && (
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5">Confirmer le mot de passe</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand text-white py-2.5 rounded-xl font-medium text-sm hover:bg-brand-dark transition disabled:opacity-60"
            >
              {loading ? (
                <span>Chargement…</span>
              ) : isRegistering ? (
                <><UserPlus size={16} />Créer le compte</>
              ) : (
                <><LogIn size={16} />Se connecter</>
              )}
            </button>
          </form>
        </div>

        {/* Switch mode */}
        <p className="text-center text-xs text-stone-400 mt-4">
          {isRegistering ? (
            <>Déjà un compte ?{' '}
              <button onClick={() => switchMode(false)} className="text-brand underline">
                Se connecter
              </button>
            </>
          ) : (
            <>Première utilisation ?{' '}
              <button onClick={() => switchMode(true)} className="text-brand underline">
                Créer un compte
              </button>
            </>
          )}
        </p>

        <p className="text-center text-xs text-stone-300 mt-2">
          Données synchronisées via Firebase
        </p>
      </div>
    </div>
  )
}
