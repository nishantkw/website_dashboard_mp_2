const RENDER_API = 'https://website-dashboard-mp-2.onrender.com/api'

function resolveApiBase() {
  if (import.meta.env.VITE_API_URL) return String(import.meta.env.VITE_API_URL).replace(/\/$/, '')
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app')) {
    return RENDER_API
  }
  if (import.meta.env.PROD) return RENDER_API
  return '/api'
}

const API_BASE = resolveApiBase()

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; status?: number }

const AUTH_EXPIRED_EVENT = 'pmjay-auth-expired'

export function onAuthExpired(handler: () => void) {
  window.addEventListener(AUTH_EXPIRED_EVENT, handler)
  return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handler)
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = 8000
): Promise<ApiResult<T>> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: 'include',
      signal: controller.signal,
      headers: isForm
        ? { ...(options.headers || {}) }
        : {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
          },
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      if (res.status === 401 && path !== '/auth/login' && path !== '/auth/me') {
        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
      }
      const details = Array.isArray(body.details) ? `: ${body.details.join('; ')}` : ''
      return { ok: false, error: (body.error || `HTTP ${res.status}`) + details, status: res.status }
    }
    return { ok: true, data: body as T }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error'
    return { ok: false, error: message }
  } finally {
    clearTimeout(timer)
  }
}

export async function checkApiHealth(): Promise<boolean> {
  const result = await apiFetch<{ ok: boolean }>('/health', {}, 3000)
  return result.ok && Boolean(result.data.ok)
}