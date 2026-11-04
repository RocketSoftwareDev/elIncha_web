// Cálculo de precios. En la web sirve para mostrar; el back recalcula todo
// con los precios de la base y es el que manda.

import type { Combo, Parche, Personalizacion, Producto, ShortCombo, Stock, TipoPrenda } from './types'

export interface LineaCarrito {
  key: string
  productoId: string
  comboId: string | null
  /** Entrega inmediata: sale de esta fila de stock, sin personalizar. */
  stockId: string | null
  /** Combo: pantaloneta elegida y su talla. */
  shortId: string | null
  tallaShort: string
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
  shorts: Map<string, ShortCombo>
}

/** Una línea de stock no lleva nombre, número, parches ni combo. */
export function lineaDeStockValida(l: LineaCarrito, s: Stock | undefined): s is Stock {
  const p = l.personalizacion
  return !!s && s.productoId === l.productoId && s.talla === l.talla && !l.comboId && !l.shortId &&
    !p.nombre.trim() && !p.numero && !p.numeroShort && p.parches.length === 0 && !p.sinSponsors
}

export interface LineaCalculada {
  key: string
  unitario: number
  subtotal: number
  parches: Parche[]
  short?: ShortCombo | null
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

  if (linea.personalizacion.sinSponsors && !producto.versionSinSponsors) throw new Error(`Sin versión sin sponsors: ${producto.id}`)

  const combo = linea.comboId ? catalogo.combos.get(linea.comboId) : undefined
  if (linea.comboId && (!combo || !combo.activo || !combo.tipos.includes(producto.tipoId) || tipo.esShort)) {
    throw new Error(`Combo no disponible: ${linea.comboId}`)
  }
  // El combo exige elegir pantaloneta y su talla; sin combo no puede venir una.
  const short = combo ? catalogo.shorts.get(linea.shortId ?? '') : undefined
  if (combo && (!short || !short.activo || !short.tallas.includes(linea.tallaShort))) throw new Error('Pantaloneta no disponible')
  if (!combo && linea.shortId) throw new Error('Pantaloneta sin combo')

  const parches = parchesValidos(producto, linea.personalizacion.parches, catalogo)
  const extra = parches.reduce((s, p) => s + p.precio, 0) + (short?.extra ?? 0)
  const unitario = redondear((combo ? combo.precio : precioBase(producto, tipo)) + extra)

  return { key: linea.key, unitario, subtotal: redondear(unitario * linea.cantidad), parches, short: short ?? null }
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

/** Dólares (Ecuador) siempre con 2 decimales: $54.00, $43.99. */
export function formatoPrecio(n: number): string {
  return `$${redondear(n).toFixed(2)}`
}

/** Partes para dibujar el precio con los centavos más pequeños. */
export function partesPrecio(n: number): { entero: string; centavos: string } {
  const [entero, centavos] = redondear(n).toFixed(2).split('.')
  return { entero, centavos }
}
