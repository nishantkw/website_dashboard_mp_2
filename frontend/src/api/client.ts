const API_BASE = import.meta.env.VITE_API_URL || '/api'

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string }

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
      const details = Array.isArray(body.details) ? `: ${body.details.join('; ')}` : ''
      return { ok: false, error: (body.error || `HTTP ${res.status}`) + details }
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
