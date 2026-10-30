import { randomBytes, scryptSync } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { cifrarClave, hashValido, limpiarHash, verificarClave } from './clave'

const crudo = (clave: string) => {
  const sal = randomBytes(16)
  const hash = scryptSync(clave, sal, 32, { N: 16384, r: 8, p: 1 })
  return { sal: sal.toString('base64'), hash: hash.toString('base64') }
}

describe('contraseña del admin', () => {
  it('verifica la correcta y rechaza la incorrecta', () => {
    const h = cifrarClave('ElHincha2026')
    expect(verificarClave('ElHincha2026', h)).toBe(true)
    expect(verificarClave('elhincha2026', h)).toBe(false)
    expect(verificarClave('', h)).toBe(false)
  })

  it('el formato nuevo no lleva «$» (se perdía al pegarlo en .env.local)', () => {
    expect(cifrarClave('x')).toMatch(/^scrypt:16384:8:1:/)
    expect(cifrarClave('x')).not.toContain('$')
  })

  it('cada cifrado lleva su propia sal', () => {
    expect(cifrarClave('misma clave')).not.toBe(cifrarClave('misma clave'))
  })

  it('sigue aceptando el formato viejo con «$»', () => {
    const { sal, hash } = crudo('Ñandú con tilde')
    expect(verificarClave('Ñandú con tilde', `scrypt$16384$8$1$${sal}$${hash}`)).toBe(true)
  })

  it('tolera lo que se cuela al copiar: espacios, comillas y «ADMIN_PASSWORD_HASH =»', () => {
    const h = cifrarClave('ElHincha2026')
    for (const pegado of [`  ${h}  `, `"${h}"`, `'${h}'`, `ADMIN_PASSWORD_HASH = ${h}`]) {
      expect(limpiarHash(pegado)).toBe(h)
      expect(verificarClave('ElHincha2026', pegado)).toBe(true)
    }
  })

  it('detecta el hash dañado (los «$16384$8$1» que se borran) en vez de decir «incorrecta»', () => {
    const { sal, hash } = crudo('ElHincha2026')
    const danado = `scrypt${sal}${hash}` // lo que queda cuando $16384, $8, $1… se interpretan como variables
    expect(hashValido(danado)).toBe(false)
    expect(hashValido(cifrarClave('ElHincha2026'))).toBe(true)
    expect(hashValido('texto-plano')).toBe(false)
  })
})
