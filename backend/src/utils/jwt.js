import { SignJWT, jwtVerify } from 'jose'
import { config } from '../config.js'

function secretKey() {
  return new TextEncoder().encode(config.jwtSecret)
}

export async function signAccessToken(user) {
  return new SignJWT({
    username: user.username,
    role: user.role,
    name: user.name,
    department: user.department || '',
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${config.jwtTtlSeconds}s`)
    .sign(secretKey())
}

export async function verifyAccessToken(token) {
  const { payload } = await jwtVerify(token, secretKey(), {
    algorithms: ['HS256'],
  })
  return payload
}

export function sessionCookieOptions() {
  const sameSite = config.cookieSameSite === 'none' ? 'none' : 'lax'
  return {
    httpOnly: true,
    secure: sameSite === 'none' ? true : config.cookieSecure,
    sameSite,
    path: '/',
    maxAge: config.jwtTtlSeconds * 1000,
  }
}

export function readAccessToken(req) {
  const fromCookie = req.cookies?.[config.cookieName]
  if (fromCookie) return fromCookie
  const header = req.headers.authorization || ''
  if (header.startsWith('Bearer ')) return header.slice(7).trim()
  return ''
}

export function setSessionCookie(res, token) {
  res.cookie(config.cookieName, token, sessionCookieOptions())
}

export function clearSessionCookie(res) {
  res.clearCookie(config.cookieName, {
    ...sessionCookieOptions(),
    maxAge: 0,
  })
}