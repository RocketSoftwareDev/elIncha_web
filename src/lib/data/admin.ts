import 'server-only'

// Datos del admin sobre la base de prueba. Mismas reglas que impondrá la API:
// un solo drop abierto, precios por tipo, combos explícitos y reserva fija.

import type {
  Ajustes, Combo, Drop, EstadoDrop, EstadoPedido, Liga, Parche, Pedido, Producto, TipoPrenda,
} from '@/lib/domain/types'
import { reiniciarEventos } from './estadisticas'
import { db, reiniciarDatos } from './mock-db'

// ---------- Resumen ----------

export async function resumenDrop(dropId: string) {
  const pedidos = db.pedidos.filter(p => p.dropId === dropId && p.estado !== 'cancelado')
  return {
    pedidos: pedidos.length,
    prendas: pedidos.reduce((s, p) => s + (p.items.length ? p.items.reduce((a, i) => a + i.cantidad * (i.comboId ? 2 : 1), 0) : 1), 0),
    vendido: pedidos.reduce((s, p) => s + p.total, 0),
    reservasPagadas: pedidos.filter(p => p.estado !== 'por_confirmar').length,
  }
}

// ---------- Drops ----------

export async function listarDrops(): Promise<Drop[]> {
  return [...db.drops].sort((a, b) => b.abreEn.localeCompare(a.abreEn))
}

export async function guardarDrop(id: string, cambios: Partial<Omit<Drop, 'id' | 'estado'>>) {
  const d = db.drops.find(x => x.id === id)
  if (!d) throw new Error('Drop no encontrado')
  Object.assign(d, cambios)
}

/** Solo puede haber un drop abierto: abrir uno nuevo exige cerrar el actual. */
export async function abrirDrop(datos: Pick<Drop, 'nombre' | 'abreEn' | 'cierraEn' | 'envioEn' | 'llegadaMinDias' | 'llegadaMaxDias'>) {
  if (db.drops.some(d => d.estado === 'abierto')) throw new Error('Ya hay un drop abierto. Ciérralo antes de abrir otro.')
  const drop: Drop = { id: crypto.randomUUID(), estado: 'abierto', mostrarCuentaRegresiva: true, ...datos }
  db.drops.unshift(drop)
  return drop
}

export async function cambiarEstadoDrop(id: string, estado: EstadoDrop) {
  const d = db.drops.find(x => x.id === id)
  if (!d) throw new Error('Drop no encontrado')
  if (estado === 'abierto' && db.drops.some(x => x.estado === 'abierto' && x.id !== id)) {
    throw new Error('Ya hay un drop abierto.')
  }
  d.estado = estado
}

// ---------- Pedidos ----------

export async function listarPedidos(filtro: { dropId?: string; estado?: EstadoPedido } = {}): Promise<Pedido[]> {
  return db.pedidos.filter(p => (!filtro.dropId || p.dropId === filtro.dropId) && (!filtro.estado || p.estado === filtro.estado))
}

export async function pedidoPorCodigo(codigo: string) {
  return db.pedidos.find(p => p.codigo === codigo) ?? null
}

export async function cambiarEstadoPedido(codigo: string, estado: EstadoPedido) {
  const p = db.pedidos.find(x => x.codigo === codigo)
  if (!p) throw new Error('Pedido no encontrado')
  p.estado = estado
}

/** Una fila por prenda: lo que necesita el proveedor para fabricar. */
export async function listaProveedorCsv(dropId: string): Promise<string> {
  const filas = [['pedido', 'prenda', 'detalle', 'talla', 'nombre', 'numero', 'numero_short', 'parches']]
  for (const p of db.pedidos.filter(x => x.dropId === dropId && x.estado !== 'cancelado')) {
    for (const i of p.items) {
      for (let n = 0; n < i.cantidad; n++) {
        filas.push([p.codigo, i.descripcion, i.detalle, i.talla, i.dorsalNombre ?? '', i.dorsalNumero ?? '', i.shortNumero ?? '', i.parches.map(x => x.nombre).join(' | ')])
      }
    }
  }
  return filas.map(f => f.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
}

// ---------- Catálogo ----------

export async function listarLigas(): Promise<Liga[]> {
  return [...db.ligas].sort((a, b) => a.orden - b.orden)
}

export async function equiposDeLiga(ligaId: string) {
  return db.equipos.filter(e => e.ligaId === ligaId).sort((a, b) => a.orden - b.orden)
}

export async function listarEquipos() {
  return [...db.equipos].sort((a, b) => a.orden - b.orden)
}

export async function productoPorId(id: string): Promise<Producto | null> {
  return db.productos.find(p => p.id === id) ?? null
}

export async function crearEquipo(ligaId: string, nombre: string) {
  db.equipos.push({ id: crypto.randomUUID(), ligaId, nombre, orden: db.equipos.length })
}

export async function listarProductos() {
  return db.productos.map(p => {
    const equipo = db.equipos.find(e => e.id === p.equipoId)!
    return {
      ...p,
      equipo,
      liga: db.ligas.find(l => l.id === equipo.ligaId)!,
      tipo: db.tipos.find(t => t.id === p.tipoId)!,
      parches: db.parches.filter(x => p.parchesPermitidos.includes(x.id)),
    }
  })
}

export async function guardarProducto(datos: Omit<Producto, 'id' | 'slug'> & { id?: string }) {
  if (datos.id) {
    const p = db.productos.find(x => x.id === datos.id)
    if (!p) throw new Error('Producto no encontrado')
    Object.assign(p, datos)
    return p
  }
  const equipo = db.equipos.find(e => e.id === datos.equipoId)
  const slug = `${equipo?.nombre ?? 'producto'}-${datos.nombre}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const p: Producto = { ...datos, id: crypto.randomUUID(), slug: `${slug}-${db.productos.length}` }
  db.productos.push(p)
  return p
}

export async function alternarVisible(id: string) {
  const p = db.productos.find(x => x.id === id)
  if (p) p.visible = !p.visible
}

// ---------- Precios, combos, parches ----------

export async function listarTipos(): Promise<TipoPrenda[]> {
  return [...db.tipos].sort((a, b) => a.orden - b.orden)
}

export async function guardarTipo(id: string, cambios: Partial<Omit<TipoPrenda, 'id'>>) {
  const t = db.tipos.find(x => x.id === id)
  if (!t) throw new Error('Tipo no encontrado')
  if (cambios.precio !== undefined && !(cambios.precio > 0)) throw new Error('El precio debe ser mayor a 0')
  Object.assign(t, cambios)
}

export async function listarCombos(): Promise<Combo[]> {
  return db.combos
}

export async function guardarCombo(datos: Omit<Combo, 'id'> & { id?: string }) {
  if (datos.tipos.length < 2) throw new Error('Un combo necesita al menos dos tipos de prenda')
  if (datos.id) {
    Object.assign(db.combos.find(c => c.id === datos.id)!, datos)
  } else {
    db.combos.push({ ...datos, id: crypto.randomUUID() })
  }
}

export async function listarParches(): Promise<(Parche & { usos: number })[]> {
  return db.parches.map(p => ({ ...p, usos: db.productos.filter(x => x.parchesPermitidos.includes(p.id)).length }))
}

export async function guardarParche(datos: Omit<Parche, 'id'> & { id?: string }) {
  if (datos.id) Object.assign(db.parches.find(p => p.id === datos.id)!, datos)
  else db.parches.push({ ...datos, id: crypto.randomUUID() })
}

// ---------- Ajustes ----------

export async function leerAjustes(): Promise<Ajustes> {
  return db.ajustes
}

export async function guardarAjustes(cambios: Partial<Ajustes>) {
  if (cambios.montoReserva !== undefined && !(cambios.montoReserva >= 0)) throw new Error('Monto de reserva inválido')
  Object.assign(db.ajustes, cambios)
}

/** Solo para modo de prueba: vuelve a los datos iniciales. */
export async function reiniciar() {
  reiniciarDatos()
  reiniciarEventos()
}
