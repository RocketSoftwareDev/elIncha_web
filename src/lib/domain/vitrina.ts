// Búsqueda y filtros de /vitrina. Funciones puras: el back aplicará las mismas reglas.
// Los filtros viajan en la URL (?q=&liga=&tipo=&equipo=&parches=&orden=&pagina=)
// para que se puedan compartir por WhatsApp.

import type { ProductoVista } from './types'

export const POR_PAGINA = 12

export type Orden = 'destacadas' | 'precio-asc' | 'precio-desc' | 'nombre'
export const ORDENES: { valor: Orden; etiqueta: string }[] = [
  { valor: 'destacadas', etiqueta: 'Destacadas' },
  { valor: 'precio-asc', etiqueta: 'Menor precio' },
  { valor: 'precio-desc', etiqueta: 'Mayor precio' },
  { valor: 'nombre', etiqueta: 'Nombre (A–Z)' },
]

export interface Filtros {
  q: string
  ligas: string[] // slugs
  tipos: string[] // ids sin prefijo: "player", "retro"…
  equipos: string[] // ids sin prefijo: "bayern"…
  parches: boolean
  orden: Orden
  pagina: number
}

type Param = string | string[] | undefined

const lista = (v: Param) => (Array.isArray(v) ? v.join(',') : (v ?? '')).split(',').map(s => s.trim()).filter(Boolean)
const corto = (id: string) => id.replace(/^[a-z]+-/, '')

export function leerFiltros(p: Record<string, Param>): Filtros {
  const orden = ORDENES.some(o => o.valor === p.orden) ? (p.orden as Orden) : 'destacadas'
  const pagina = Math.max(1, Number.parseInt(String(p.pagina ?? '1'), 10) || 1)
  return {
    q: String(Array.isArray(p.q) ? p.q[0] : (p.q ?? '')).slice(0, 60).trim(),
    ligas: lista(p.liga),
    tipos: lista(p.tipo),
    equipos: lista(p.equipo),
    parches: p.parches === '1',
    orden,
    pagina,
  }
}

/** URL de /vitrina con los filtros dados. Cambiar un filtro vuelve a la página 1. */
export function urlVitrina(f: Filtros, cambios: Partial<Filtros> = {}): string {
  const n = { ...f, pagina: 1, ...cambios }
  const s = new URLSearchParams()
  if (n.q) s.set('q', n.q)
  if (n.ligas.length) s.set('liga', n.ligas.join(','))
  if (n.tipos.length) s.set('tipo', n.tipos.join(','))
  if (n.equipos.length) s.set('equipo', n.equipos.join(','))
  if (n.parches) s.set('parches', '1')
  if (n.orden !== 'destacadas') s.set('orden', n.orden)
  if (n.pagina > 1) s.set('pagina', String(n.pagina))
  const qs = s.toString()
  return qs ? `/vitrina?${qs}` : '/vitrina'
}

export function alternar(valores: string[], v: string): string[] {
  return valores.includes(v) ? valores.filter(x => x !== v) : [...valores, v]
}

/** Sin tildes y en minúsculas: «múnich» encuentra «Múnich» y «munich». */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function coincide(p: ProductoVista, q: string): boolean {
  if (!q) return true
  const texto = normalizar(`${p.equipo.nombre} ${p.liga.nombre} ${p.nombre} ${p.tipo.nombre}`)
  return normalizar(q).split(/\s+/).every(palabra => texto.includes(palabra))
}

type Faceta = 'ligas' | 'tipos' | 'equipos'

function aplicar(productos: ProductoVista[], f: Filtros, excepto?: Faceta): ProductoVista[] {
  return productos.filter(
    p =>
      coincide(p, f.q) &&
      (excepto === 'ligas' || !f.ligas.length || f.ligas.includes(p.liga.slug)) &&
      (excepto === 'tipos' || !f.tipos.length || f.tipos.includes(corto(p.tipo.id))) &&
      (excepto === 'equipos' || !f.equipos.length || f.equipos.includes(corto(p.equipo.id))) &&
      (!f.parches || p.parches.length > 0),
  )
}

function contar<T extends string>(productos: ProductoVista[], clave: (p: ProductoVista) => T) {
  const m = new Map<T, number>()
  for (const p of productos) m.set(clave(p), (m.get(clave(p)) ?? 0) + 1)
  return m
}

function ordenar(productos: ProductoVista[], orden: Orden): ProductoVista[] {
  const nombre = (p: ProductoVista) => `${p.equipo.nombre} ${p.nombre}`
  const r = [...productos]
  switch (orden) {
    case 'precio-asc': return r.sort((a, b) => a.precio - b.precio || nombre(a).localeCompare(nombre(b), 'es'))
    case 'precio-desc': return r.sort((a, b) => b.precio - a.precio || nombre(a).localeCompare(nombre(b), 'es'))
    case 'nombre': return r.sort((a, b) => nombre(a).localeCompare(nombre(b), 'es'))
    default: return r.sort((a, b) => Number(b.destacado) - Number(a.destacado) || a.liga.orden - b.liga.orden || a.equipo.orden - b.equipo.orden)
  }
}

export function buscar(productos: ProductoVista[], f: Filtros) {
  const resultado = ordenar(aplicar(productos, f), f.orden)
  const paginas = Math.max(1, Math.ceil(resultado.length / POR_PAGINA))
  const pagina = Math.min(f.pagina, paginas)
  return {
    total: resultado.length,
    pagina,
    paginas,
    productos: resultado.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA),
    // Cada faceta cuenta con los demás filtros aplicados, para que los números no mientan.
    porLiga: contar(aplicar(productos, f, 'ligas'), p => p.liga.slug),
    porTipo: contar(aplicar(productos, f, 'tipos'), p => corto(p.tipo.id)),
    porEquipo: contar(aplicar(productos, f, 'equipos'), p => corto(p.equipo.id)),
  }
}

export const idCorto = corto
