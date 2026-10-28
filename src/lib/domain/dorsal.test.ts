import { describe, expect, it } from 'vitest'
import { largo, normalizarNombre, normalizarNumero, validarNombre, validarNumero } from './dorsal'

describe('normalizarNombre', () => {
  it('pasa a mayúsculas con Ñ y tildes', () => {
    expect(normalizarNombre('muñoz')).toBe('MUÑOZ')
    expect(normalizarNombre('pérez')).toBe('PÉREZ')
  })

  it('convierte el apóstrofe curvo del celular en recto', () => {
    expect(normalizarNombre('o’neill')).toBe("O'NEILL")
  })

  it('deja un solo espacio entre palabras', () => {
    expect(normalizarNombre('de    jong')).toBe('DE JONG')
  })
})

describe('validarNombre', () => {
  it('acepta Ñ, tildes, apóstrofe, punto y guion', () => {
    for (const n of ['MUÑOZ', 'PÉREZ', "O'NEILL", 'J. PÉREZ', 'JEAN-PAUL', 'MÜLLER']) {
      expect(validarNombre(n)).toBeNull()
    }
  })

  it('cuenta una É descompuesta como un solo carácter', () => {
    const decompuesto = 'PÉREZ' // E + tilde suelta, como lo mandan algunos celulares
    expect(largo(normalizarNombre(decompuesto))).toBe(5)
    expect(validarNombre('ABCDEFGHÍ')).toBeNull() // 10 caracteres visibles
  })

  it('rechaza más de 10 caracteres contando espacios', () => {
    expect(validarNombre("D'ALESSANDRO")).toBe('largo')
    expect(validarNombre('ABCDE FGHIJ')).toBe('largo')
    expect(validarNombre('ABCDE FGHI')).toBeNull()
  })

  it('rechaza números y símbolos', () => {
    expect(validarNombre('MESSI10')).toBe('caracteres')
    expect(validarNombre('HOLA!')).toBe('caracteres')
  })

  it('el nombre vacío es válido porque es opcional', () => {
    expect(validarNombre('')).toBeNull()
  })
})

describe('número', () => {
  it('conserva el cero adelante', () => {
    expect(normalizarNumero('07')).toBe('07')
    expect(validarNumero('07')).toBe(true)
  })

  it('quita lo que no es dígito y corta a dos', () => {
    expect(normalizarNumero('1a23')).toBe('12')
  })

  it('vacío es válido, tres dígitos no', () => {
    expect(validarNumero('')).toBe(true)
    expect(validarNumero('100')).toBe(false)
  })
})
