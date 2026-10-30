import 'server-only'

// Sesión del admin: cookie httpOnly firmada con HMAC (SESSION_SECRET).
// Esto es lo que protege de verdad: el proxy solo redirige rápido. Cada página,
// acción y ruta del admin llama a requerirAdmin().

import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { repo } from '@/lib/data/repo'

export const COOKIE_ADMIN = 'eh_admin'
const DURACION = 8 * 60 * 60 * 1000 // 8 horas

/**
 * Sin ADMIN_PASSWORD_HASH el admin solo queda abierto en modo de prueba local.
 * Con Supabase (Netlify) faltar la clave cierra el admin por completo.
 */
export function authConfigurada() {
  return !!(process.env.ADMIN_PASSWORD_HASH && (process.env.SESSION_SECRET?.length ?? 0) >= 32)
}
export const adminAbiertoEnPrueba = () => !authConfigurada() && repo.modo === 'prueba'

function secreto() {
  const s = process.env.SESSION_SECRET
  if (!s || s.length < 32) throw new Error('SESSION_SECRET debe tener al menos 32 caracteres')
  return s
}

/** Cambia si cambia la contraseña: así cambiarla cierra todas las sesiones. */
const versionClave = () => createHash('sha256').update(process.env.ADMIN_PASSWORD_HASH ?? '').digest('hex').slice(0, 12)

const firmar = (datos: string) => createHmac('sha256', secreto()).update(datos).digest('base64url')

export async function iniciarSesion() {
  const vence = Date.now() + DURACION
  const datos = `${vence}.${versionClave()}`
  ;(await cookies()).set(COOKIE_ADMIN, `${datos}.${firmar(datos)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: DURACION / 1000,
  })
}

export async function cerrarSesion() {
  ;(await cookies()).delete(COOKIE_ADMIN)
}

export async function sesionValida(): Promise<boolean> {
  if (adminAbiertoEnPrueba()) return true
  if (!authConfigurada()) return false
  const valor = (await cookies()).get(COOKIE_ADMIN)?.value
  if (!valor) return false
  const [vence, version, firma] = valor.split('.')
  if (!vence || !version || !firma) return false
  const esperada = Buffer.from(firmar(`${vence}.${version}`))
  const recibida = Buffer.from(firma)
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return false
  return Number(vence) > Date.now() && version === versionClave()
}

/** Para páginas y acciones del admin: sin sesión, al login. */
export async function requerirAdmin() {
  if (!(await sesionValida())) redirect('/admin/login')
}
