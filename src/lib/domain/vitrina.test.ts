import { describe, expect, it } from 'vitest'
import type { ProductoVista } from './types'
import { buscar, leerFiltros, urlVitrina, type Filtros } from './vitrina'

const prod = (id: string, equipo: string, liga: string, tipo: string, precio: number, extra: Partial<ProductoVista> = {}): ProductoVista => ({
  id, slug: id, equipoId: `e-${equipo}`, tipoId: `t-${tipo}`, nombre: 'Local', precioEspecial: null, visible: true, destacado: false,
  fotos: [], parchesPermitidos: [], precio, parches: [],
  equipo: { id: `e-${equipo}`, ligaId: `l-${liga}`, nombre: equipo === 'fcb' ? 'FC Barcelona' : equipo === 'bsc' ? 'Barcelona SC' : equipo === 'bayern' ? 'Bayern Múnich' : equipo, orden: 0 },
  liga: { id: `l-${liga}`, slug: liga, nombre: liga, foto: '', orden: 0, visible: true },
  tipo: { id: `t-${tipo}`, nombre: tipo, precio, tallas: [], aceptaPersonalizacion: true, esShort: tipo === 'short', orden: 0 },
  ...extra,
})

const catalogo = [
  prod('fcb', 'fcb', 'laliga', 'player', 40, { destacado: true }),
  prod('bsc', 'bsc', 'nacionales', 'player', 40),
  prod('bayern', 'bayern', 'bundesliga', 'player', 40, { parches: [{ id: 'p', nombre: 'UCL', precio: 1, activo: true }] }),
  prod('bayern-short', 'bayern', 'bundesliga', 'short', 20),
  prod('ec', 'ecuador', 'retro', 'retro', 38),
]

const f = (p: Record<string, string>): Filtros => leerFiltros(p)

describe('buscar', () => {
  it('«barcelona» encuentra al FC Barcelona y a Barcelona SC', () => {
    expect(buscar(catalogo, f({ q: 'barcelona' })).productos.map(p => p.id).sort()).toEqual(['bsc', 'fcb'])
  })

  it('ignora tildes: «munich» encuentra Bayern Múnich', () => {
    expect(buscar(catalogo, f({ q: 'munich' })).total).toBe(2)
  })

  it('combina liga y tipo de producto', () => {
    expect(buscar(catalogo, f({ liga: 'bundesliga', tipo: 'short' })).productos.map(p => p.id)).toEqual(['bayern-short'])
  })

  it('las cantidades de una faceta no se filtran por esa misma faceta', () => {
    const r = buscar(catalogo, f({ liga: 'bundesliga' }))
    expect(r.porLiga.get('laliga')).toBe(1)
    expect(r.porTipo.get('short')).toBe(1)
  })

  it('«solo con parches»', () => {
    expect(buscar(catalogo, f({ parches: '1' })).productos.map(p => p.id)).toEqual(['bayern'])
  })

  it('ordena por precio', () => {
    expect(buscar(catalogo, f({ orden: 'precio-asc' })).productos[0].id).toBe('bayern-short')
  })
})

describe('urlVitrina', () => {
  it('arma la URL y vuelve a la página 1 al cambiar un filtro', () => {
    const base = f({ q: 'bayern', pagina: '3' })
    expect(urlVitrina(base, { ligas: ['bundesliga'] })).toBe('/vitrina?q=bayern&liga=bundesliga')
  })

  it('ignora un orden desconocido', () => {
    expect(f({ orden: 'hackeo' }).orden).toBe('destacadas')
  })
})
