// Cálculo de precios. En la web sirve para mostrar; el back recalcula todo
// con los precios de la base y es el que manda.

import type { Combo, Parche, Personalizacion, Producto, Stock, TipoPrenda } from './types'

export interface LineaCarrito {
  key: string
  productoId: string
  comboId: string | null
  /** Entrega inmediata: sale de esta fila de stock, sin personalizar. */
  stockId: string | null
  talla: string
  cantidad: number
  personalizacion: Personalizacion
}

export interface Catalogo {
  productos: Map<string, Producto>
  tipos: Map<string, TipoPrenda>
  parches: Map<string, Parche>
  combos: Map<string, Combo>
  stock: Map<string, Stock>
}

/** Una línea de stock no lleva nombre, número, parches ni combo. */
export function lineaDeStockValida(l: LineaCarrito, s: Stock | undefined): s is Stock {
  const p = l.personalizacion
  return !!s && s.productoId === l.productoId && s.talla === l.talla && !l.comboId &&
    !p.nombre.trim() && !p.numero && !p.numeroShort && p.parches.length === 0
}

export interface LineaCalculada {
  key: string
  unitario: number
  subtotal: number
  parches: Parche[]
}

export function precioBase(producto: Producto, tipo: TipoPrenda): number {
  return producto.precioEspecial ?? tipo.precio
}

/** Solo cuentan los parches que el admin permite para ese producto. */
export function parchesValidos(producto: Producto, ids: string[], catalogo: Catalogo): Parche[] {
  return ids
    .filter(id => producto.parchesPermitidos.includes(id))
    .map(id => catalogo.parches.get(id))
    .filter((p): p is Parche => !!p && p.activo)
}

export function calcularLinea(linea: LineaCarrito, catalogo: Catalogo): LineaCalculada {
  const producto = catalogo.productos.get(linea.productoId)
  if (!producto) throw new Error(`Producto desconocido: ${linea.productoId}`)
  const tipo = catalogo.tipos.get(producto.tipoId)
  if (!tipo) throw new Error(`Tipo desconocido: ${producto.tipoId}`)

  if (linea.stockId) {
    const s = catalogo.stock.get(linea.stockId)
    if (!lineaDeStockValida(linea, s)) throw new Error(`Stock no válido: ${linea.stockId}`)
    const unitario = redondear(s.precio ?? precioBase(producto, tipo))
    return { key: linea.key, unitario, subtotal: redondear(unitario * linea.cantidad), parches: [] }
  }

  const combo = linea.comboId ? catalogo.combos.get(linea.comboId) : undefined
  if (linea.comboId && (!combo || !combo.activo)) throw new Error(`Combo no disponible: ${linea.comboId}`)

  const parches = parchesValidos(producto, linea.personalizacion.parches, catalogo)
  const extra = parches.reduce((s, p) => s + p.precio, 0)
  const unitario = redondear((combo ? combo.precio : precioBase(producto, tipo)) + extra)

  return { key: linea.key, unitario, subtotal: redondear(unitario * linea.cantidad), parches }
}

export function calcularTotal(lineas: LineaCarrito[], catalogo: Catalogo) {
  const calculadas = lineas.map(l => calcularLinea(l, catalogo))
  const total = redondear(calculadas.reduce((s, l) => s + l.subtotal, 0))
  const articulos = lineas.reduce((s, l) => s + l.cantidad, 0)
  return { lineas: calculadas, total, articulos }
}

export function redondear(n: number): number {
  return Math.round(n * 100) / 100
}

export function formatoPrecio(n: number): string {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2).replace('.', ',')}`
}
