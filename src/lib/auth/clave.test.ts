import { randomBytes, scryptSync } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { cifrarClave, verificarClave } from './clave'

describe('contraseña del admin', () => {
  it('verifica la correcta y rechaza la incorrecta', () => {
    const h = cifrarClave('Hincha-Machala-2026')
    expect(verificarClave('Hincha-Machala-2026', h)).toBe(true)
    expect(verificarClave('hincha-machala-2026', h)).toBe(false)
    expect(verificarClave('', h)).toBe(false)
  })

  it('cada cifrado lleva su propia sal', () => {
    expect(cifrarClave('misma clave')).not.toBe(cifrarClave('misma clave'))
  })

  it('rechaza formatos raros sin romperse', () => {
    expect(verificarClave('x', 'texto-plano')).toBe(false)
    expect(verificarClave('x', 'md5$abc')).toBe(false)
  })

  it('acepta el formato que genera scripts/clave-admin.mjs', () => {
    const sal = randomBytes(16)
    const hash = scryptSync('Ñandú con tilde', sal, 32, { N: 16384, r: 8, p: 1 })
    const guardado = `scrypt$16384$8$1$${sal.toString('base64')}$${hash.toString('base64')}`
    expect(verificarClave('Ñandú con tilde', guardado)).toBe(true)
  })
})
