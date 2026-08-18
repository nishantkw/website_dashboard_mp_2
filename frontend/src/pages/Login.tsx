import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, Shield } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { getDefaultRouteForRole } from '../auth/mockUsers'
import type { UserRole } from '../auth/types'
import { ROLE_OPTIONS } from '../auth/types'
import { mockUsers } from '../auth/mockUsers'
import { ROLE_LABELS } from '../auth/types'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('state_admin')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login({ username, password, role })
    setLoading(false)

    if (result.success && result.user) {
      navigate(getDefaultRouteForRole(result.user.role), { replace: true })
    } else {
      setError(result.error ?? 'Login failed')
    }
  }

  const fillDemo = (user: string, pass: string, userRole: UserRole) => {
    setUsername(user)
    setPassword(pass)
    setRole(userRole)
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef6f0] via-[#f0f7f2] to-[#e2f3e8] flex flex-col">
      {/* Mini government header */}
      <header className="bg-white shadow-md">
        <div className="h-1.5 bg-gradient-to-r from-[#1a5c38] via-[#2d8a4e] to-[#1a5c38]" />
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <img
            src="/images/ayushman-mp-logo.png"
            alt="Ayushman MP"
            className="h-14 w-14 object-contain"
          />
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#1a3a6b] leading-tight">
              Ayushman Bharat — PM-JAY
            </h1>
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              State Health Agency, Madhya Pradesh
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Login card */}
          <div className="bg-white rounded-2xl shadow-xl border border-[#c6e6d0] overflow-hidden">
            <div className="bg-gradient-to-r from-[#2d8a4e] to-[#1a5c38] px-6 py-5 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Secure Login</h2>
              <p className="text-green-100 text-sm mt-1">Analytics Dashboard Portal</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#2d8a4e] focus:ring-2 focus:ring-[#2d8a4e]/20 transition-all"
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#2d8a4e] focus:ring-2 focus:ring-[#2d8a4e]/20 transition-all"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Select Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#2d8a4e] focus:ring-2 focus:ring-[#2d8a4e]/20 transition-all bg-white text-gray-800"
                  required
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2d8a4e] hover:bg-[#247a42] disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Demo credentials */}
          <div className="mt-5 bg-white/70 border border-[#c6e6d0] rounded-xl p-4">
            <p className="text-xs font-semibold text-[#1a5c38] uppercase tracking-wider mb-3">
              Demo Credentials (Role-based)
            </p>
            <div className="space-y-2">
              {mockUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => fillDemo(u.username, u.password, u.role)}
                  className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-[#e8f5ec] transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800 group-hover:text-[#1a5c38]">
                      {u.username}
                    </p>
                    <p className="text-xs text-gray-500">{ROLE_LABELS[u.role]}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">{u.password}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center py-4 text-xs text-gray-500">
        &copy; 2025 State Health Agency, Madhya Pradesh. Demo Mode.
      </footer>
    </div>
  )
}
