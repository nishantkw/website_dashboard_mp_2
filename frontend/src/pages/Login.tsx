import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, ChevronRight } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { getDefaultRouteForRole, mockUsers } from '../auth/mockUsers'
import type { UserRole } from '../auth/types'
import { ROLE_OPTIONS, ROLE_LABELS } from '../auth/types'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('state_admin')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDemo, setShowDemo] = useState(false)

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
    setShowDemo(false)
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ fontFamily: "'Manrope', 'Segoe UI', system-ui, sans-serif" }}
    >
      {/* Brand panel — fixed viewport height, never grows with form */}
      <aside className="relative hidden h-full w-[48%] shrink-0 overflow-hidden lg:flex lg:flex-col">
        {/* Layered background */}
        <div className="absolute inset-0 bg-[#0c3222]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_20%,#2d8a4e_0%,transparent_55%)] opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_85%,#1a5c38_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0a281a]/80 via-transparent to-[#3aa86a]/25" />

        {/* Soft mesh / atmosphere */}
        <div
          className="absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />

        {/* Decorative rings */}
        <div className="absolute -right-28 top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full border border-white/10" />
        <div className="absolute -right-16 top-1/2 h-[380px] w-[380px] -translate-y-1/2 rounded-full border border-emerald-200/15" />
        <div className="absolute -right-4 top-1/2 h-[240px] w-[240px] -translate-y-1/2 rounded-full bg-gradient-to-br from-white/10 to-transparent blur-sm" />

        {/* Floating light orbs */}
        <div className="absolute left-[12%] top-[18%] h-40 w-40 animate-[floatSlow_8s_ease-in-out_infinite] rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute bottom-[20%] left-[40%] h-52 w-52 animate-[floatSlow_11s_ease-in-out_infinite_reverse] rounded-full bg-amber-200/10 blur-3xl" />
        <div className="absolute right-[10%] top-[12%] h-28 w-28 rounded-full bg-white/10 blur-2xl" />

        {/* Top gold hairline */}
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />

        <div className="relative z-10 flex h-full flex-col justify-between px-12 py-12 xl:px-16">
          {/* Logos in glass shelf */}
          <div className="inline-flex w-fit items-center gap-12 rounded-2xl border border-white/15 bg-white/10 px-8 py-5 shadow-[0_8px_40px_rgba(0,0,0,0.25)] backdrop-blur-md">
            <img
              src="/images/ayushman-mp-logo.png"
              alt="Ayushman Madhya Pradesh"
              className="h-[72px] w-[72px] rounded-full bg-white object-contain p-1.5 shadow-lg ring-2 ring-white/50"
            />
            <div className="h-12 w-px bg-gradient-to-b from-transparent via-white/40 to-transparent" />
            <img
              src="/images/mp-government-emblem.png"
              alt="Madhya Pradesh"
              className="h-[68px] w-[68px] object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
            />
          </div>

          {/* Brand text block */}
          <div className="relative max-w-xl animate-[fadeUp_0.7s_ease-out]">
            <div className="absolute -left-6 top-0 h-full w-1 rounded-full bg-gradient-to-b from-amber-300/80 via-emerald-200/50 to-transparent" />
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.32em] text-emerald-100/80">
              State Health Agency · Madhya Pradesh
            </p>
            <h1
              className="text-[2.75rem] font-semibold leading-[1.1] tracking-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.25)] xl:text-[3.25rem]"
              style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
            >
              Ayushman Bharat
              <span className="mt-2 block bg-gradient-to-r from-emerald-50 to-emerald-200/90 bg-clip-text text-transparent">
                PM-JAY Analytics
              </span>
            </h1>
            <div className="mt-5 h-px w-24 bg-gradient-to-r from-amber-300/90 to-transparent" />
            <p
              className="mt-5 text-[1.65rem] font-medium italic tracking-wide text-amber-100/95"
              style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
            >
              “Niramayam”
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 max-w-[48px] bg-white/20" />
            <p className="text-xs text-emerald-100/50">
              © {new Date().getFullYear()} State Health Agency, Madhya Pradesh
            </p>
          </div>
        </div>
      </aside>

      {/* Form panel — only this side scrolls when demo credentials open */}
      <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#f4faf6]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(45,138,78,0.08),transparent_50%)]" />

        {/* Mobile brand strip */}
        <div className="relative z-10 shrink-0 border-b border-emerald-100 bg-white px-5 py-4 lg:hidden">
          <div className="flex items-center gap-3">
            <img src="/images/ayushman-mp-logo.png" alt="Ayushman MP" className="h-12 w-12 object-contain" />
            <div>
              <p className="text-sm font-bold text-[#1a3a6b]">Ayushman Bharat — PM-JAY</p>
              <p className="text-[10px] uppercase tracking-wide text-slate-500">State Health Agency, MP</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-1 items-start justify-center px-5 py-10 sm:px-8 lg:items-center">
          <div className="w-full max-w-[420px] animate-[fadeUp_0.55s_ease-out] lg:my-auto">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-emerald-900/5 bg-white p-6 shadow-[0_20px_50px_-24px_rgba(26,92,56,0.35)] sm:p-7"
            >
              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#2d8a4e] focus:bg-white focus:ring-4 focus:ring-[#2d8a4e]/12"
                    required
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 pr-11 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#2d8a4e] focus:bg-white focus:ring-4 focus:ring-[#2d8a4e]/12"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Select Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-[#2d8a4e] focus:bg-white focus:ring-4 focus:ring-[#2d8a4e]/12"
                    required
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1a5c38] to-[#2d8a4e] py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition-all hover:brightness-110 hover:shadow-xl disabled:opacity-60"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Demo credentials — collapsible, less clutter */}
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setShowDemo((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl border border-emerald-100 bg-white/80 px-4 py-3 text-left text-sm text-[#1a5c38] transition-colors hover:bg-emerald-50/80"
              >
                <span className="font-semibold">Demo credentials</span>
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${showDemo ? 'rotate-90' : ''}`}
                />
              </button>

              {showDemo && (
                <div className="mt-2 space-y-1.5 rounded-xl border border-emerald-100 bg-white p-2 shadow-sm">
                  {mockUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => fillDemo(u.username, u.password, u.role)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[#e8f5ec]"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{u.username}</p>
                        <p className="text-xs text-slate-500">{ROLE_LABELS[u.role]}</p>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">{u.password}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className="mt-8 text-center text-[11px] text-slate-400 lg:hidden">
              © {new Date().getFullYear()} State Health Agency, Madhya Pradesh · Demo Mode
            </p>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-18px) scale(1.05); }
        }
      `}</style>
    </div>
  )
}
