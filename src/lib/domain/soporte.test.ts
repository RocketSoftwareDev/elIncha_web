import { describe, expect, it } from 'vitest'
import { aBloques, idSeccion, seccionesPublicas } from './soporte'

describe('aBloques', () => {
  it('separa párrafos por línea en blanco y une las líneas seguidas', () => {
    expect(aBloques('Hola\nmundo\n\nSegundo')).toEqual([
      { tipo: 'parrafo', texto: 'Hola mundo' },
      { tipo: 'parrafo', texto: 'Segundo' },
    ])
  })

  it('las líneas con «- » son una lista', () => {
    expect(aBloques('Cuida tu camiseta:\n- Lavar al revés\n- Agua fría')).toEqual([
      { tipo: 'parrafo', texto: 'Cuida tu camiseta:' },
      { tipo: 'lista', items: ['Lavar al revés', 'Agua fría'] },
    ])
  })

  it('las líneas con «|» son una tabla (la primera es la cabecera)', () => {
    const [t] = aBloques('Talla | Pecho | Largo\n---|---|---\nS | 50 | 70\nM | 53')
    expect(t).toEqual({ tipo: 'tabla', cabecera: ['Talla', 'Pecho', 'Largo'], filas: [['S', '50', '70'], ['M', '53', '']] })
  })

  it('no interpreta HTML: el texto se muestra tal cual', () => {
    expect(aBloques('<script>alert(1)</script>')).toEqual([{ tipo: 'parrafo', texto: '<script>alert(1)</script>' }])
  })

  it('texto vacío no produce bloques', () => {
    expect(aBloques('  \n\n ')).toEqual([])
  })
})

describe('seccionesPublicas', () => {
  it('solo las visibles con texto', () => {
    const s = [
      { id: 'a', titulo: 'A', contenido: 'x', visible: true },
      { id: 'b', titulo: 'B', contenido: '  ', visible: true },
      { id: 'c', titulo: 'C', contenido: 'x', visible: false },
    ]
    expect(seccionesPublicas(s).map(x => x.id)).toEqual(['a'])
    expect(seccionesPublicas(undefined)).toEqual([])
  })
})

describe('idSeccion', () => {
  it('sin tildes y sin repetir', () => {
    expect(idSeccion('Guía de lavado', [])).toBe('guia-de-lavado')
    expect(idSeccion('Cambios', ['cambios'])).toBe('cambios-2')
  })
})
