import { config } from '../config.js'

/** Never leak SQL/driver internals to clients in production. */
export function clientError(err, fallback = 'Internal server error') {
  if (config.nodeEnv === 'production') return fallback
  return err?.message || fallback
}
