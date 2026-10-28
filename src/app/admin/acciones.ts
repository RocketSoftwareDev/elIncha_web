'use server'

// Acciones del admin. Validan con zod y delegan en src/lib/data/admin.ts;
// cuando exista el back, admin.ts llamará a la API y estas acciones no cambian.

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { inputAIso } from '@/components/admin/fechas'
import * as admin from '@/lib/data/admin'
import type { EstadoPedido } from '@/lib/domain/types'

export type Resultado = { ok?: string; error?: string } | null

const fechaLocal = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Fecha inválida')
const dias = z.coerce.number().int().min(1).max(120)
const marcado = (f: FormData, k: string) => f.get(k) === 'on'

function errorDe(e: unknown): string {
  if (e instanceof z.ZodError) return e.issues[0]?.message ?? 'Datos inválidos'
  return e instanceof Error ? e.message : 'Algo salió mal'
}

function refrescar() {
  revalidatePath('/admin', 'layout')
  revalidatePath('/', 'layout')
}

// ---------- Drops ----------

const dropSchema = z
  .object({
    nombre: z.string().trim().min(3, 'El nombre es muy corto').max(60),
    abreEn: fechaLocal,
    cierraEn: fechaLocal,
    envioEn: fechaLocal,
    llegadaMinDias: dias,
    llegadaMaxDias: dias,
  })
  .refine(d => d.abreEn < d.cierraEn, 'El cierre debe ser después de la apertura')
  .refine(d => d.llegadaMinDias <= d.llegadaMaxDias, 'Los días «desde» no pueden superar a «hasta»')

function leerDrop(f: FormData) {
  const d = dropSchema.parse(Object.fromEntries(f))
  return { ...d, abreEn: inputAIso(d.abreEn), cierraEn: inputAIso(d.cierraEn), envioEn: inputAIso(d.envioEn) }
}

export async function guardarDropAccion(_: Resultado, f: FormData): Promise<Resultado> {
  try {
    const id = z.string().min(1).parse(f.get('id'))
    await admin.guardarDrop(id, { ...leerDrop(f), mostrarCuentaRegresiva: marcado(f, 'mostrarCuentaRegresiva') })
  } catch (e) {
    return { error: errorDe(e) }
  }
  refrescar()
  return { ok: 'Cambios guardados' }
}

export async function abrirDropAccion(_: Resultado, f: FormData): Promise<Resultado> {
  try {
    await admin.abrirDrop(leerDrop(f))
  } catch (e) {
    return { error: errorDe(e) }
  }
  refrescar()
  return { ok: 'Drop abierto. La tienda ya recibe pedidos.' }
}

export async function cerrarDropAccion(f: FormData) {
  await admin.cambiarEstadoDrop(z.string().min(1).parse(f.get('id')), 'cerrado')
  refrescar()
}

// ---------- Pedidos ----------

const estadoPedido = z.enum(['por_confirmar', 'reserva_pagada', 'pagado', 'entregado', 'cancelado'])

export async function estadoPedidoAccion(f: FormData) {
  const codigo = z.string().regex(/^EH-\d+$/).parse(f.get('codigo'))
  const estado: EstadoPedido = estadoPedido.parse(f.get('estado'))
  await admin.cambiarEstadoPedido(codigo, estado)
  refrescar()
}

// ---------- Productos ----------

const productoSchema = z.object({
  id: z.string().optional(),
  equipoId: z.string().min(1, 'Elige un equipo'),
  tipoId: z.string().min(1, 'Elige un tipo de prenda'),
  nombre: z.string().trim().min(2, 'Escribe el nombre de la opción').max(60),
  precioEspecial: z.union([z.literal(''), z.coerce.number().positive('El precio especial debe ser mayor a 0')]),
})

export async function guardarProductoAccion(_: Resultado, f: FormData): Promise<Resultado> {
  try {
    const d = productoSchema.parse({
      id: f.get('id') || undefined,
      equipoId: f.get('equipoId') ?? '',
      tipoId: f.get('tipoId') ?? '',
      nombre: f.get('nombre') ?? '',
      precioEspecial: f.get('precioEspecial') ?? '',
    })
    const existente = d.id ? await admin.productoPorId(d.id) : null
    await admin.guardarProducto({
      id: d.id,
      equipoId: d.equipoId,
      tipoId: d.tipoId,
      nombre: d.nombre,
      precioEspecial: d.precioEspecial === '' ? null : d.precioEspecial,
      // «Guardar borrador» la deja oculta aunque el interruptor esté prendido.
      visible: f.get('modo') !== 'borrador' && marcado(f, 'visible'),
      destacado: marcado(f, 'destacado'),
      fotos: existente?.fotos ?? [],
      parchesPermitidos: f.getAll('parches').map(String),
    })
  } catch (e) {
    return { error: errorDe(e) }
  }
  refrescar()
  redirect('/admin/productos')
}

export async function alternarVisibleAccion(f: FormData) {
  await admin.alternarVisible(z.string().min(1).parse(f.get('id')))
  refrescar()
}

// ---------- Ligas y equipos ----------

export async function crearEquipoAccion(_: Resultado, f: FormData): Promise<Resultado> {
  try {
    const ligaId = z.string().min(1).parse(f.get('ligaId'))
    const nombre = z.string().trim().min(2, 'Escribe el nombre del equipo').max(50).parse(f.get('nombre'))
    await admin.crearEquipo(ligaId, nombre)
  } catch (e) {
    return { error: errorDe(e) }
  }
  refrescar()
  return { ok: 'Equipo agregado' }
}

// ---------- Precios, combos y parches ----------

const precio = z.coerce.number().positive('Los precios deben ser mayores a 0').max(1000)

export async function guardarPreciosAccion(_: Resultado, f: FormData): Promise<Resultado> {
  try {
    for (const t of await admin.listarTipos()) {
      await admin.guardarTipo(t.id, {
        precio: precio.parse(f.get(`precio_${t.id}`)),
        aceptaPersonalizacion: marcado(f, `acepta_${t.id}`),
      })
    }
    const precioParche = precio.parse(f.get('precioParche'))
    for (const p of await admin.listarParches()) {
      await admin.guardarParche({ id: p.id, nombre: p.nombre, precio: precioParche, activo: p.activo })
    }
  } catch (e) {
    return { error: errorDe(e) }
  }
  refrescar()
  return { ok: 'Precios guardados. La vitrina ya muestra los nuevos.' }
}

export async function crearComboAccion(_: Resultado, f: FormData): Promise<Resultado> {
  try {
    await admin.guardarCombo({
      nombre: z.string().trim().min(3, 'Escribe el nombre del combo').max(40).parse(f.get('nombre')),
      precio: precio.parse(f.get('precio')),
      activo: true,
      tipos: f.getAll('tipos').map(String),
    })
  } catch (e) {
    return { error: errorDe(e) }
  }
  refrescar()
  return { ok: 'Combo creado' }
}

export async function crearParcheAccion(_: Resultado, f: FormData): Promise<Resultado> {
  try {
    const nombre = z.string().trim().min(3, 'Escribe el nombre del parche').max(40).parse(f.get('nombre'))
    const actual = (await admin.listarParches())[0]?.precio ?? 1
    await admin.guardarParche({ nombre, precio: actual, activo: true })
  } catch (e) {
    return { error: errorDe(e) }
  }
  refrescar()
  return { ok: 'Parche agregado' }
}

// ---------- Ajustes ----------

const texto = (max: number) => z.string().trim().min(1, 'Hay campos vacíos').max(max)

export async function guardarAjustesAccion(_: Resultado, f: FormData): Promise<Resultado> {
  try {
    const actuales = await admin.leerAjustes()
    await admin.guardarAjustes({
      whatsapp: z.string().trim().regex(/^\+?[\d ()-]{7,20}$/, 'Número de WhatsApp inválido').parse(f.get('whatsapp')),
      horario: texto(60).parse(f.get('horario')),
      saludo: texto(120).parse(f.get('saludo')),
      montoReserva: z.coerce.number().min(0, 'Monto de reserva inválido').max(100).parse(f.get('montoReserva')),
      metodosPago: actuales.metodosPago.map(m => ({ ...m, activo: marcado(f, `pago_${m.id}`) })),
      pasosComoComprar: actuales.pasosComoComprar.map((_, i) => texto(160).parse(f.get(`paso_${i}`))),
      redes: {
        instagram: texto(60).parse(f.get('instagram')),
        tiktok: texto(60).parse(f.get('tiktok')),
        facebook: texto(60).parse(f.get('facebook')),
      },
    })
  } catch (e) {
    return { error: errorDe(e) }
  }
  refrescar()
  return { ok: 'Ajustes guardados' }
}

// ---------- Modo de prueba ----------

export async function reiniciarAccion() {
  await admin.reiniciar()
  refrescar()
}
