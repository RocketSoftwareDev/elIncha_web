import 'server-only'

// Datos de la tienda. Salen del repositorio (Supabase en Netlify, memoria en local).
// Las reglas se aplican aquí, en el servidor: el navegador nunca decide precios.

import { createHash } from 'node:crypto'
import { z } from 'zod'
import { aceptaPedidos } from '@/lib/domain/drop'
import { normalizarNombre, normalizarNumero, validarNombre, validarNumero } from '@/lib/domain/dorsal'
import { calcularLinea, type Catalogo } from '@/lib/domain/pricing'
import type { Drop, PedidoItem, ProductoVista } from '@/lib/domain/types'
import { armarMensaje, enlaceWhatsapp } from '@/lib/domain/whatsapp'
import { catalogo, repo, type DatosCatalogo } from './repo'

export async function dropActual(): Promise<Drop | null> {
  return (await catalogo()).drops.find(d => d.estado === 'abierto') ?? null
}

export async function ajustesPublicos() {
  return (await catalogo()).ajustes
}

export async function ligasVisibles() {
  return (await catalogo()).ligas.filter(l => l.visible).sort((a, b) => a.orden - b.orden)
}

export async function tipos() {
  return [...(await catalogo()).tipos].sort((a, b) => a.orden - b.orden)
}

export async function combosActivos() {
  return (await catalogo()).combos.filter(c => c.activo)
}

function vista(c: DatosCatalogo, id: string): ProductoVista | null {
  const p = c.productos.find(x => x.id === id)
  if (!p) return null
  const equipo = c.equipos.find(e => e.id === p.equipoId)
  const liga = equipo && c.ligas.find(l => l.id === equipo.ligaId)
  const tipo = c.tipos.find(t => t.id === p.tipoId)
  if (!equipo || !liga || !tipo) return null
  const parches = c.parches.filter(x => x.activo && p.parchesPermitidos.includes(x.id))
  return { ...p, equipo, liga, tipo, parches, precio: p.precioEspecial ?? tipo.precio }
}

/** Todo el catálogo visible; /vitrina filtra con `buscar` (lib/domain/vitrina). */
export async function catalogoVisible(): Promise<ProductoVista[]> {
  const c = await catalogo()
  return c.productos
    .filter(p => p.visible)
    .map(p => vista(c, p.id))
    .filter((p): p is ProductoVista => !!p && p.liga.visible)
}

export async function equiposVisibles() {
  return [...(await catalogo()).equipos].sort((a, b) => a.orden - b.orden)
}

export async function productoPorSlug(slug: string): Promise<ProductoVista | null> {
  const c = await catalogo()
  const p = c.productos.find(x => x.slug === slug && x.visible)
  return p ? vista(c, p.id) : null
}

/** El short del mismo equipo, para armar el combo desde la ficha de la camiseta. */
export async function shortDelEquipo(equipoId: string): Promise<ProductoVista | null> {
  const c = await catalogo()
  const s = c.productos.find(p => p.equipoId === equipoId && p.visible && c.tipos.find(t => t.id === p.tipoId)?.esShort)
  return s ? vista(c, s.id) : null
}

function catalogoPrecios(c: DatosCatalogo): Catalogo {
  return {
    productos: new Map(c.productos.map(p => [p.id, p])),
    tipos: new Map(c.tipos.map(t => [t.id, t])),
    parches: new Map(c.parches.map(p => [p.id, p])),
    combos: new Map(c.combos.map(x => [x.id, x])),
  }
}

// ---------- Crear pedido ----------

const lineaSchema = z.object({
  key: z.string().max(64),
  productoId: z.string().max(64),
  comboId: z.string().max(64).nullable(),
  talla: z.string().max(4),
  cantidad: z.number().int().min(1).max(10),
  personalizacion: z.object({
    nombre: z.string().max(40),
    numero: z.string().max(4),
    numeroShort: z.string().max(4),
    parches: z.array(z.string().max(64)).max(6),
  }),
})

export const pedidoSchema = z.object({
  cliente: z.string().trim().min(2).max(60),
  whatsapp: z.string().trim().regex(/^[\d +()-]{7,20}$/),
  sector: z.string().trim().min(2).max(80),
  lineas: z.array(lineaSchema).min(1).max(20),
})

export type EntradaPedido = z.infer<typeof pedidoSchema>

export type ResultadoPedido =
  | { ok: true; codigo: string; total: number; reserva: number; whatsappUrl: string }
  | { ok: false; error: string }

/** Límite contra pedidos falsos en ráfaga: 4 cada 10 minutos por visitante. */
const MAX_PEDIDOS = 4
const VENTANA = 10 * 60 * 1000

export async function crearPedido(entrada: unknown, contexto: { ip: string }): Promise<ResultadoPedido> {
  const parsed = pedidoSchema.safeParse(entrada)
  if (!parsed.success) return { ok: false, error: 'Revisa tus datos: nombre, WhatsApp y sector son obligatorios.' }
  const { cliente, whatsapp, sector, lineas } = parsed.data

  const clave = `pedido:${createHash('sha256').update(contexto.ip).digest('hex').slice(0, 16)}`
  if ((await repo.contarIntentos(clave, Date.now() - VENTANA)) >= MAX_PEDIDOS) {
    return { ok: false, error: 'Recibimos varios pedidos seguidos desde aquí. Espera unos minutos o escríbenos por WhatsApp.' }
  }

  const c = await catalogo()
  const drop = c.drops.find(d => d.estado === 'abierto') ?? null
  if (!aceptaPedidos(drop, Date.now())) return { ok: false, error: 'No hay un drop abierto. Pronto realizaremos otro drop.' }

  const cat = catalogoPrecios(c)
  const items: PedidoItem[] = []
  for (const l of lineas) {
    const producto = cat.productos.get(l.productoId)
    const tipo = producto && cat.tipos.get(producto.tipoId)
    if (!producto || !producto.visible || !tipo) return { ok: false, error: 'Una de las prendas ya no está disponible.' }
    if (!tipo.tallas.includes(l.talla)) return { ok: false, error: `Talla no disponible: ${l.talla}` }

    const nombre = normalizarNombre(l.personalizacion.nombre).trim()
    const numero = normalizarNumero(l.personalizacion.numero)
    const numeroShort = l.comboId ? normalizarNumero(l.personalizacion.numeroShort) : ''
    if ((nombre || numero) && !tipo.aceptaPersonalizacion) return { ok: false, error: `${tipo.nombre} no lleva nombre ni número.` }
    if (validarNombre(nombre) || !validarNumero(numero) || !validarNumero(numeroShort)) {
      return { ok: false, error: 'Revisa el nombre o el número del dorsal.' }
    }

    let calc
    try {
      calc = calcularLinea({ ...l, personalizacion: { ...l.personalizacion, nombre, numero, numeroShort } }, cat)
    } catch {
      return { ok: false, error: 'Una de las opciones ya no está disponible.' }
    }
    const v = vista(c, producto.id)
    if (!v) return { ok: false, error: 'Una de las prendas ya no está disponible.' }
    const combo = l.comboId ? cat.combos.get(l.comboId) : undefined
    items.push({
      id: crypto.randomUUID(),
      descripcion: combo ? `Combo ${combo.nombre}` : `${v.equipo.nombre} ${producto.nombre}`,
      detalle: combo ? `${v.equipo.nombre} ${producto.nombre} + Short · Talla ${l.talla}` : `${tipo.nombre} · Talla ${l.talla}`,
      talla: l.talla,
      cantidad: l.cantidad,
      dorsalNombre: nombre || null,
      dorsalNumero: numero || null,
      shortNumero: numeroShort || null,
      parches: calc.parches.map(p => ({ nombre: p.nombre, precio: p.precio })),
      precioUnitario: calc.unitario,
      subtotal: calc.subtotal,
      comboId: combo?.id ?? null,
      productoId: producto.id,
    })
  }

  const total = items.reduce((s, i) => s + i.subtotal, 0)
  const reserva = Math.min(c.ajustes.montoReserva, total)
  await repo.registrarIntento(clave)
  const { codigo } = await repo.crearPedido({
    dropId: drop!.id, clienteNombre: cliente, clienteWhatsapp: whatsapp, sector, total, reserva, estado: 'por_confirmar', items,
  })

  const mensaje = armarMensaje({
    saludo: c.ajustes.saludo,
    drop: drop!.nombre,
    lineas: items.map(i => ({
      cantidad: i.cantidad,
      titulo: i.descripcion,
      detalle: i.detalle.replace(' · Talla ', ' · '),
      subtotal: i.subtotal,
      dorsal: describirDorsal(i),
    })),
    total,
    reserva,
    cliente,
    sector,
    codigo,
  })

  return { ok: true, codigo, total, reserva, whatsappUrl: enlaceWhatsapp(c.ajustes.whatsapp, mensaje) }
}

export function describirDorsal(i: Pick<PedidoItem, 'dorsalNombre' | 'dorsalNumero' | 'shortNumero' | 'parches'>): string | undefined {
  const partes: string[] = []
  if (i.dorsalNombre || i.dorsalNumero) partes.push([i.dorsalNombre, i.dorsalNumero && `#${i.dorsalNumero}`].filter(Boolean).join(' '))
  if (i.shortNumero) partes.push(`short #${i.shortNumero}`)
  for (const p of i.parches) partes.push(`parche ${p.nombre}`)
  return partes.length ? partes.join(' + ') : undefined
}
