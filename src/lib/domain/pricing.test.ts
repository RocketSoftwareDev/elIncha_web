import { describe, expect, it } from 'vitest'
import { calcularLinea, calcularTotal, formatoPrecio, type Catalogo, type LineaCarrito } from './pricing'
import type { Combo, Parche, Producto, TipoPrenda } from './types'

const player: TipoPrenda = { id: 't-player', nombre: 'Camiseta Player', precio: 40, tallas: [], aceptaPersonalizacion: true, esShort: false, orden: 1 }
const retro: TipoPrenda = { id: 't-retro', nombre: 'Retro', precio: 38, tallas: [], aceptaPersonalizacion: true, esShort: false, orden: 2 }
const champions: Parche = { id: 'p-ucl', nombre: 'Champions League', precio: 1, activo: true }
const mundial: Parche = { id: 'p-wc', nombre: 'Copa Mundial', precio: 1, activo: true }
const kit: Combo = { id: 'c-kit', nombre: 'Kit completo', precio: 55, activo: true, tipos: ['t-player', 't-short'] }

const producto = (p: Partial<Producto>): Producto => ({
  id: 'x', slug: 'x', equipoId: 'e', tipoId: 't-player', nombre: 'Local', precioEspecial: null,
  visible: true, destacado: false, fotos: [], parchesPermitidos: ['p-ucl'], ...p,
})

const madrid = producto({ id: 'rm', tipoId: 't-player' })
const ecuador = producto({ id: 'ec', tipoId: 't-retro', parchesPermitidos: ['p-wc'] })
const especial = producto({ id: 'esp', precioEspecial: 45 })

const catalogo: Catalogo = {
  productos: new Map([madrid, ecuador, especial].map(p => [p.id, p])),
  tipos: new Map([player, retro].map(t => [t.id, t])),
  parches: new Map([champions, mundial].map(p => [p.id, p])),
  combos: new Map([[kit.id, kit]]),
}

const linea = (l: Partial<LineaCarrito>): LineaCarrito => ({
  key: 'k', productoId: 'rm', comboId: null, talla: 'L', cantidad: 1,
  personalizacion: { nombre: '', numero: '', numeroShort: '', parches: [] }, ...l,
})

describe('calcularLinea', () => {
  it('usa el precio del tipo de prenda', () => {
    expect(calcularLinea(linea({}), catalogo).unitario).toBe(40)
  })

  it('el precio especial reemplaza al del tipo', () => {
    expect(calcularLinea(linea({ productoId: 'esp' }), catalogo).unitario).toBe(45)
  })

  it('suma $1 por parche permitido e ignora los no permitidos', () => {
    const l = linea({ personalizacion: { nombre: 'VERA', numero: '10', numeroShort: '', parches: ['p-ucl', 'p-wc'] } })
    const r = calcularLinea(l, catalogo)
    expect(r.unitario).toBe(41)
    expect(r.parches.map(p => p.id)).toEqual(['p-ucl'])
  })

  it('el combo cobra su precio más los parches', () => {
    const l = linea({ comboId: 'c-kit', personalizacion: { nombre: 'VERA', numero: '10', numeroShort: '10', parches: ['p-ucl'] } })
    expect(calcularLinea(l, catalogo).unitario).toBe(56)
  })

  it('multiplica por la cantidad', () => {
    expect(calcularLinea(linea({ cantidad: 2 }), catalogo).subtotal).toBe(80)
  })
})

describe('calcularTotal', () => {
  it('reproduce el pedido de ejemplo del diseño: $135', () => {
    const r = calcularTotal([
      linea({ key: 'a', comboId: 'c-kit', personalizacion: { nombre: 'VERA', numero: '10', numeroShort: '', parches: ['p-ucl'] } }),
      linea({ key: 'b', productoId: 'rm' }),
      linea({ key: 'c', productoId: 'ec', personalizacion: { nombre: 'MOISÉS', numero: '7', numeroShort: '', parches: ['p-wc'] } }),
    ], catalogo)
    expect(r.total).toBe(135)
    expect(r.articulos).toBe(3)
  })
})

describe('formatoPrecio', () => {
  it('muestra enteros sin decimales y decimales con coma', () => {
    expect(formatoPrecio(40)).toBe('$40')
    expect(formatoPrecio(67.5)).toBe('$67,50')
  })
})
