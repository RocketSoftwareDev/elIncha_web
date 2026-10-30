// Contraseña del admin con scrypt (incluido en Node, sin dependencias).
// Formato: scrypt:N:r:p:salBase64:hashBase64
//
// Se usa «:» y no «$» porque «$» se pierde al copiarlo en .env.local o en una terminal
// (se interpreta como variable: $16384 → vacío). Se sigue aceptando el formato viejo con «$».

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const N = 16384
const R = 8
const P = 1
const LARGO = 32

export function cifrarClave(clave: string): string {
  const sal = randomBytes(16)
  const hash = scryptSync(clave.normalize('NFC'), sal, LARGO, { N, r: R, p: P })
  return `scrypt:${N}:${R}:${P}:${sal.toString('base64')}:${hash.toString('base64')}`
}

/** Quita lo que suele colarse al copiar: espacios, comillas y el «NOMBRE =» del inicio. */
export function limpiarHash(valor: string): string {
  return valor
    .trim()
    .replace(/^ADMIN_PASSWORD_HASH\s*=\s*/, '')
    .replace(/^["']|["']$/g, '')
    .trim()
}

function partes(guardado: string): string[] | null {
  const limpio = limpiarHash(guardado)
  const p = limpio.startsWith('scrypt:') ? limpio.split(':') : limpio.split('$')
  if (p.length !== 6 || p[0] !== 'scrypt') return null
  if (![p[1], p[2], p[3]].every(n => /^\d+$/.test(n)) || !p[4] || !p[5]) return null
  return p
}

/** Para avisar «el hash está mal copiado» en vez de «contraseña incorrecta». */
export function hashValido(guardado: string): boolean {
  return partes(guardado) !== null
}

export function verificarClave(clave: string, guardado: string): boolean {
  const p = partes(guardado)
  if (!p) return false
  const [, n, r, pp, sal, hash] = p
  const esperado = Buffer.from(hash, 'base64')
  if (esperado.length !== LARGO) return false
  const calculado = scryptSync(clave.normalize('NFC'), Buffer.from(sal, 'base64'), esperado.length, { N: Number(n), r: Number(r), p: Number(pp) })
  return timingSafeEqual(calculado, esperado)
}
