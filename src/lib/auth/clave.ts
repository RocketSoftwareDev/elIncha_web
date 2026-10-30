// Contraseña del admin con scrypt (incluido en Node, sin dependencias).
// Formato: scrypt$N$r$p$salBase64$hashBase64

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const N = 16384
const R = 8
const P = 1
const LARGO = 32

export function cifrarClave(clave: string): string {
  const sal = randomBytes(16)
  const hash = scryptSync(clave.normalize('NFC'), sal, LARGO, { N, r: R, p: P })
  return `scrypt$${N}$${R}$${P}$${sal.toString('base64')}$${hash.toString('base64')}`
}

export function verificarClave(clave: string, guardado: string): boolean {
  const partes = guardado.split('$')
  if (partes.length !== 6 || partes[0] !== 'scrypt') return false
  const [, n, r, p, sal, hash] = partes
  const esperado = Buffer.from(hash, 'base64')
  const calculado = scryptSync(clave.normalize('NFC'), Buffer.from(sal, 'base64'), esperado.length, { N: Number(n), r: Number(r), p: Number(p) })
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado)
}
