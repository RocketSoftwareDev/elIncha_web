import 'server-only'

// Datos del admin. Mismas reglas en memoria y en Supabase: un solo drop abierto,
// precios por tipo de prenda, combos explícitos y reserva fija.
// Quien llama (acciones y páginas del admin) ya verificó la sesión.

import type {
  Ajustes, Combo, Drop, EstadoDrop, EstadoPedido, Liga, Parche, Pedido, Producto, TipoPrenda,
} from '@/lib/domain/types'
import { catalogo, ErrorNegocio, repo } from './repo'

// ---------- Resumen del drop ----------

export async function resumenDrop(dropId: string) {
  const pedidos = (await repo.pedidos({ dropId })).filter(p => p.estado !== 'cancelado')
  return {
    pedidos: pedidos.length,
    prendas: pedidos.reduce((s, p) => s + (p.items.length ? p.items.reduce((a, i) => a + i.cantidad * (i.comboId ? 2 : 1), 0) : 1), 0),
    vendido: pedidos.reduce((s, p) => s + p.total, 0),
    reservasPagadas: pedidos.filter(p => p.estado !== 'por_confirmar').length,
  }
}

// ---------- Drops ----------

export async function listarDrops(): Promise<Drop[]> {
  return [...(await catalogo()).drops].sort((a, b) => b.abreEn.localeCompare(a.abreEn))
}

export async function guardarDrop(id: string, cambios: Partial<Omit<Drop, 'id' | 'estado'>>) {
  const d = (await catalogo()).drops.find(x => x.id === id)
  if (!d) throw new ErrorNegocio('Drop no encontrado')
  await repo.guardarDrop({ ...d, ...cambios })
}

/** Solo puede haber un drop abierto: abrir uno nuevo exige cerrar el actual. */
export async function abrirDrop(datos: Pick<Drop, 'nombre' | 'abreEn' | 'cierraEn' | 'envioEn' | 'llegadaMinDias' | 'llegadaMaxDias'>) {
  if ((await catalogo()).drops.some(d => d.estado === 'abierto')) throw new ErrorNegocio('Ya hay un drop abierto. Ciérralo antes de abrir otro.')
  const drop: Drop = { id: crypto.randomUUID(), estado: 'abierto', mostrarCuentaRegresiva: true, ...datos }
  await repo.guardarDrop(drop)
  return drop
}

export async function cambiarEstadoDrop(id: string, estado: EstadoDrop) {
  const d = (await catalogo()).drops.find(x => x.id === id)
  if (!d) throw new ErrorNegocio('Drop no encontrado')
  await repo.guardarDrop({ ...d, estado })
}

// ---------- Pedidos ----------

export async function listarPedidos(filtro: { dropId?: string; estado?: EstadoPedido } = {}): Promise<Pedido[]> {
  return repo.pedidos(filtro)
}

export async function pedidoPorCodigo(codigo: string) {
  return repo.pedidoPorCodigo(codigo)
}

export async function cambiarEstadoPedido(codigo: string, estado: EstadoPedido) {
  await repo.cambiarEstadoPedido(codigo, estado)
}

/** Una fila por prenda: lo que necesita el proveedor para fabricar. */
export async function listaProveedorCsv(dropId: string): Promise<string> {
  const filas = [['pedido', 'prenda', 'detalle', 'talla', 'nombre', 'numero', 'numero_short', 'parches']]
  for (const p of (await repo.pedidos({ dropId })).filter(x => x.estado !== 'cancelado')) {
    for (const i of p.items) {
      for (let n = 0; n < i.cantidad; n++) {
        filas.push([p.codigo, i.descripcion, i.detalle, i.talla, i.dorsalNombre ?? '', i.dorsalNumero ?? '', i.shortNumero ?? '', i.parches.map(x => x.nombre).join(' | ')])
      }
    }
  }
  // Una celda que empieza con = + - @ se ejecutaría como fórmula en Excel.
  const celda = (c: string) => `"${(/^[=+\-@]/.test(c) ? `'${c}` : c).replace(/"/g, '""')}"`
  return filas.map(f => f.map(celda).join(',')).join('\n')
}

// ---------- Catálogo ----------

export async function listarLigas(): Promise<Liga[]> {
  return [...(await catalogo()).ligas].sort((a, b) => a.orden - b.orden)
}

export async function equiposDeLiga(ligaId: string) {
  return (await catalogo()).equipos.filter(e => e.ligaId === ligaId).sort((a, b) => a.orden - b.orden)
}

export async function listarEquipos() {
  return [...(await catalogo()).equipos].sort((a, b) => a.orden - b.orden)
}

export async function productoPorId(id: string): Promise<Producto | null> {
  return (await catalogo()).productos.find(p => p.id === id) ?? null
}

export async function crearEquipo(ligaId: string, nombre: string) {
  const c = await catalogo()
  if (!c.ligas.some(l => l.id === ligaId)) throw new ErrorNegocio('Liga no encontrada')
  await repo.crearEquipo({ id: crypto.randomUUID(), ligaId, nombre, orden: c.equipos.length })
}

export async function listarProductos() {
  const c = await catalogo()
  return c.productos.flatMap(p => {
    const equipo = c.equipos.find(e => e.id === p.equipoId)
    const liga = equipo && c.ligas.find(l => l.id === equipo.ligaId)
    const tipo = c.tipos.find(t => t.id === p.tipoId)
    if (!equipo || !liga || !tipo) return []
    return [{ ...p, equipo, liga, tipo, parches: c.parches.filter(x => p.parchesPermitidos.includes(x.id)) }]
  })
}

const aSlug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 70)

export async function guardarProducto(datos: Omit<Producto, 'id' | 'slug'> & { id?: string }) {
  const c = await catalogo()
  if (datos.id) {
    const p = c.productos.find(x => x.id === datos.id)
    if (!p) throw new ErrorNegocio('Producto no encontrado')
    const actualizado = { ...p, ...datos, id: p.id, slug: p.slug }
    await repo.guardarProducto(actualizado)
    return actualizado
  }
  const equipo = c.equipos.find(e => e.id === datos.equipoId)
  if (!equipo) throw new ErrorNegocio('Equipo no encontrado')
  if (!c.tipos.some(t => t.id === datos.tipoId)) throw new ErrorNegocio('Tipo de prenda no encontrado')
  const base = aSlug(`${equipo.nombre}-${datos.nombre}`) || 'producto'
  let slug = base
  for (let n = 2; c.productos.some(p => p.slug === slug); n++) slug = `${base}-${n}`
  const p: Producto = { ...datos, id: crypto.randomUUID(), slug }
  await repo.guardarProducto(p)
  return p
}

export async function alternarVisible(id: string) {
  const p = (await catalogo()).productos.find(x => x.id === id)
  if (p) await repo.guardarProducto({ ...p, visible: !p.visible })
}

/** Guarda una foto ya convertida a WebP en el navegador y la agrega al producto. */
export async function agregarFoto(productoId: string, datos: Uint8Array) {
  const p = (await catalogo()).productos.find(x => x.id === productoId)
  if (!p) throw new ErrorNegocio('Producto no encontrado')
  if (p.fotos.length >= 6) throw new ErrorNegocio('Máximo 6 fotos por camiseta')
  const url = await repo.subirFoto(`productos/${p.id}/${crypto.randomUUID()}.webp`, datos)
  await repo.guardarProducto({ ...p, fotos: [...p.fotos, url] })
}

export async function quitarFoto(productoId: string, url: string) {
  const p = (await catalogo()).productos.find(x => x.id === productoId)
  if (!p) throw new ErrorNegocio('Producto no encontrado')
  await repo.guardarProducto({ ...p, fotos: p.fotos.filter(f => f !== url) })
}

// ---------- Precios, combos, parches ----------

export async function listarTipos(): Promise<TipoPrenda[]> {
  return [...(await catalogo()).tipos].sort((a, b) => a.orden - b.orden)
}

export async function guardarTipo(id: string, cambios: Partial<Omit<TipoPrenda, 'id'>>) {
  const t = (await catalogo()).tipos.find(x => x.id === id)
  if (!t) throw new ErrorNegocio('Tipo no encontrado')
  if (cambios.precio !== undefined && !(cambios.precio > 0)) throw new ErrorNegocio('El precio debe ser mayor a 0')
  await repo.guardarTipo({ ...t, ...cambios })
}

export async function listarCombos(): Promise<Combo[]> {
  return (await catalogo()).combos
}

export async function guardarCombo(datos: Omit<Combo, 'id'> & { id?: string }) {
  if (datos.tipos.length < 2) throw new ErrorNegocio('Un combo necesita al menos dos tipos de prenda')
  await repo.guardarCombo({ ...datos, id: datos.id ?? crypto.randomUUID() })
}

export async function listarParches(): Promise<(Parche & { usos: number })[]> {
  const c = await catalogo()
  return c.parches.map(p => ({ ...p, usos: c.productos.filter(x => x.parchesPermitidos.includes(p.id)).length }))
}

export async function guardarParche(datos: Omit<Parche, 'id'> & { id?: string }) {
  await repo.guardarParche({ ...datos, id: datos.id ?? crypto.randomUUID() })
}

// ---------- Ajustes ----------

export async function leerAjustes(): Promise<Ajustes> {
  return (await catalogo()).ajustes
}

export async function guardarAjustes(cambios: Partial<Ajustes>) {
  if (cambios.montoReserva !== undefined && !(cambios.montoReserva >= 0)) throw new ErrorNegocio('Monto de reserva inválido')
  await repo.guardarAjustes({ ...(await catalogo()).ajustes, ...cambios })
}

export const modoPrueba = () => repo.modo === 'prueba'

/** Solo para modo de prueba: vuelve a los datos iniciales. */
export async function reiniciar() {
  await repo.reiniciar()
}
