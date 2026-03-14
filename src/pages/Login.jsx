import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Droplets, User, Lock, Eye, EyeOff, LogIn, UserPlus, Info } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { hasUsers, login, register, currentUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (currentUser) navigate('/dashboard', { replace: true })
  }, [currentUser, navigate])

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!username.trim()) {
      setError('Le nom d\'utilisateur est requis.')
      return
    }
    if (password.length < 6) {
      setError('Le mot de passe doit comporter au moins 6 caractères.')
      return
    }

    if (!hasUsers && password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    try {
      if (hasUsers) {
        await login(username.trim(), password)
      } else {
        await register(username.trim(), password)
      }
      // Navigation handled by useEffect watching currentUser
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
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
            {hasUsers ? 'Connexion' : 'Créer un compte'}
          </h2>
          <p className="text-sm text-stone-400 mb-5">
            {hasUsers
              ? 'Identifiez-vous pour accéder à vos données.'
              : 'Première utilisation — créez votre compte.'}
          </p>

          {/* Info banner for first registration */}
          {!hasUsers && (
            <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-3.5 py-3 mb-5 text-sm text-blue-700">
              <Info size={16} className="flex-shrink-0 mt-0.5" />
              <span>Vos données existantes seront automatiquement associées à ce compte.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1.5">
                Nom d'utilisateur
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition"
                  placeholder="Votre nom d'utilisateur"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition"
                  placeholder="••••••••"
                  autoComplete={hasUsers ? 'current-password' : 'new-password'}
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

            {/* Confirm password (registration only) */}
            {!hasUsers && (
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand text-white py-2.5 rounded-xl font-medium text-sm hover:bg-brand-dark transition disabled:opacity-60"
            >
              {loading ? (
                <span>Chargement…</span>
              ) : hasUsers ? (
                <>
                  <LogIn size={16} />
                  Se connecter
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Créer le compte
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-stone-400 mt-6">
          Système Water Light 3 étapes
        </p>
      </div>
    </div>
  )
}
