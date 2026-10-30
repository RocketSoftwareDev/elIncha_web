import 'server-only'

// Almacenamiento en Supabase. Usa la llave de servicio, que SOLO existe en el
// servidor (variable secreta de Netlify). Las tablas tienen RLS sin políticas:
// la llave pública no puede leer ni escribir nada.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type {
  Ajustes, Combo, Drop, Equipo, EstadoDrop, EstadoPedido, Liga, Parche, Pedido, PedidoItem, Producto, Stock, TipoPrenda,
} from '@/lib/domain/types'
import { ErrorNegocio, type EventoGuardado, type Repo } from './tipos'

let cliente: SupabaseClient | null = null

function sb(): SupabaseClient {
  if (cliente) return cliente
  const url = process.env.SUPABASE_URL
  const llave = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !llave) throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  cliente = createClient(url, llave, { auth: { persistSession: false, autoRefreshToken: false } })
  return cliente
}

/** Lanza si Supabase respondió con error. Nunca muestra detalles internos al cliente. */
type Respuesta<T> = { data: T | null; error: { message: string; code?: string } | null }

function ok<T>(r: Respuesta<T>, contexto: string): T | null {
  if (r.error) {
    if (r.error.code === '23505' && contexto === 'drop') throw new ErrorNegocio('Ya hay un drop abierto. Ciérralo antes de abrir otro.')
    if (r.error.code === '23505' && contexto === 'stock') throw new ErrorNegocio('Esa camiseta ya tiene stock en esa talla: ajusta la cantidad en la lista.')
    if (r.error.message?.includes('SIN_STOCK')) throw new ErrorNegocio('Una de las camisetas de entrega inmediata ya se vendió. Revisa tu carrito.')
    console.error(`[supabase] ${contexto}:`, r.error.code, r.error.message)
    throw new Error(`Error de base de datos (${contexto})`)
  }
  return r.data
}

/** Respuesta que siempre trae datos (listas y .single()). */
function datos<T>(r: Respuesta<T>, contexto: string): NonNullable<T> {
  const d = ok(r, contexto)
  if (d === null || d === undefined) throw new Error(`Sin datos (${contexto})`)
  return d as NonNullable<T>
}

const num = (v: unknown) => Number(v)

// ---------- filas ↔ modelo ----------

type Fila = Record<string, unknown>

const aLiga = (f: Fila): Liga => ({ id: f.id as string, slug: f.slug as string, nombre: f.nombre as string, foto: f.foto as string, orden: f.orden as number, visible: f.visible as boolean })
const aEquipo = (f: Fila): Equipo => ({ id: f.id as string, ligaId: f.liga_id as string, nombre: f.nombre as string, orden: f.orden as number, escudo: (f.escudo as string) ?? '' })
const aTipo = (f: Fila): TipoPrenda => ({ id: f.id as string, nombre: f.nombre as string, precio: num(f.precio), tallas: f.tallas as string[], aceptaPersonalizacion: f.acepta_personalizacion as boolean, esShort: f.es_short as boolean, orden: f.orden as number })
const aParche = (f: Fila): Parche => ({ id: f.id as string, nombre: f.nombre as string, precio: num(f.precio), activo: f.activo as boolean })
const aCombo = (f: Fila): Combo => ({ id: f.id as string, nombre: f.nombre as string, precio: num(f.precio), activo: f.activo as boolean, tipos: f.tipos as string[] })
const aProducto = (f: Fila): Producto => ({
  id: f.id as string, slug: f.slug as string, equipoId: f.equipo_id as string, tipoId: f.tipo_id as string, nombre: f.nombre as string,
  precioEspecial: f.precio_especial === null ? null : num(f.precio_especial), visible: f.visible as boolean, destacado: f.destacado as boolean,
  fotos: f.fotos as string[], parchesPermitidos: f.parches_permitidos as string[],
})
const aStock = (f: Fila): Stock => ({ id: f.id as string, productoId: f.producto_id as string, talla: f.talla as string, cantidad: f.cantidad as number, precio: f.precio === null ? null : num(f.precio) })
const aDrop = (f: Fila): Drop => ({
  id: f.id as string, nombre: f.nombre as string, abreEn: new Date(f.abre_en as string).toISOString(), cierraEn: new Date(f.cierra_en as string).toISOString(),
  envioEn: new Date(f.envio_en as string).toISOString(), llegadaMinDias: f.llegada_min_dias as number, llegadaMaxDias: f.llegada_max_dias as number,
  estado: f.estado as EstadoDrop, mostrarCuentaRegresiva: f.mostrar_cuenta_regresiva as boolean,
})
const aPedido = (f: Fila): Pedido => ({
  id: f.id as string, codigo: f.codigo as string, dropId: (f.drop_id as string | null) ?? null, clienteNombre: f.cliente_nombre as string,
  clienteWhatsapp: f.cliente_whatsapp as string, sector: f.sector as string, total: num(f.total), reserva: num(f.reserva),
  estado: f.estado as EstadoPedido, creadoEn: new Date(f.creado_en as string).toISOString(), items: f.items as PedidoItem[],
})

const deDrop = (d: Drop) => ({
  id: d.id, nombre: d.nombre, abre_en: d.abreEn, cierra_en: d.cierraEn, envio_en: d.envioEn, llegada_min_dias: d.llegadaMinDias,
  llegada_max_dias: d.llegadaMaxDias, estado: d.estado, mostrar_cuenta_regresiva: d.mostrarCuentaRegresiva,
})
const deProducto = (p: Producto) => ({
  id: p.id, slug: p.slug, equipo_id: p.equipoId, tipo_id: p.tipoId, nombre: p.nombre, precio_especial: p.precioEspecial,
  visible: p.visible, destacado: p.destacado, fotos: p.fotos, parches_permitidos: p.parchesPermitidos,
})

export const repoSupabase: Repo = {
  modo: 'supabase',

  async catalogo() {
    const c = sb()
    const [drops, ligas, equipos, tipos, parches, productos, combos, stock, ajustes] = await Promise.all([
      c.from('drops').select('*').order('abre_en', { ascending: false }),
      c.from('ligas').select('*').order('orden'),
      c.from('equipos').select('*').order('orden'),
      c.from('tipos_prenda').select('*').order('orden'),
      c.from('parches').select('*').order('nombre'),
      c.from('productos').select('*'),
      c.from('combos').select('*'),
      c.from('stock').select('*'),
      c.from('ajustes').select('datos').eq('id', 1).single(),
    ])
    return {
      drops: datos(drops, 'drops').map(aDrop),
      ligas: datos(ligas, 'ligas').map(aLiga),
      equipos: datos(equipos, 'equipos').map(aEquipo),
      tipos: datos(tipos, 'tipos').map(aTipo),
      parches: datos(parches, 'parches').map(aParche),
      productos: datos(productos, 'productos').map(aProducto),
      combos: datos(combos, 'combos').map(aCombo),
      stock: datos(stock, 'stock').map(aStock),
      ajustes: datos(ajustes, 'ajustes').datos as Ajustes,
    }
  },

  async pedidos(f = {}) {
    let q = sb().from('pedidos').select('*').order('creado_en', { ascending: false }).limit(1000)
    if (f.dropId) q = q.eq('drop_id', f.dropId)
    if (f.sinDrop) q = q.is('drop_id', null)
    if (f.estado) q = q.eq('estado', f.estado)
    if (f.desde !== undefined) q = q.gte('creado_en', new Date(f.desde).toISOString())
    if (f.hasta !== undefined) q = q.lte('creado_en', new Date(f.hasta).toISOString())
    return datos(await q, 'pedidos').map(aPedido)
  },
  async pedidoPorCodigo(codigo) {
    const f = ok(await sb().from('pedidos').select('*').eq('codigo', codigo).maybeSingle(), 'pedido')
    return f ? aPedido(f) : null
  },
  async crearPedido(p) {
    // crear_pedido() (migración 0006) aparta el stock y crea el pedido en una sola transacción.
    const r = await sb().rpc('crear_pedido', {
      p: {
        dropId: p.dropId, clienteNombre: p.clienteNombre, clienteWhatsapp: p.clienteWhatsapp, sector: p.sector,
        total: p.total, reserva: p.reserva, items: p.items,
      },
    })
    return { codigo: datos(r as Respuesta<string>, 'crear pedido') }
  },
  async cambiarEstadoPedido(codigo, estado) {
    // Cancelar devuelve el stock; reactivar un cancelado lo vuelve a apartar.
    ok(await sb().rpc('cambiar_estado_pedido', { p_codigo: codigo, p_estado: estado }), 'estado pedido')
  },

  async guardarDrop(d) { ok(await sb().from('drops').upsert(deDrop(d)), 'drop') },
  async guardarLiga(l) { ok(await sb().from('ligas').upsert({ id: l.id, slug: l.slug, nombre: l.nombre, foto: l.foto, orden: l.orden, visible: l.visible }), 'liga') },
  async guardarEquipo(e) { ok(await sb().from('equipos').upsert({ id: e.id, liga_id: e.ligaId, nombre: e.nombre, orden: e.orden, escudo: e.escudo }), 'equipo') },
  async guardarProducto(p) { ok(await sb().from('productos').upsert(deProducto(p)), 'producto') },
  async guardarTipo(t) {
    ok(await sb().from('tipos_prenda').upsert({ id: t.id, nombre: t.nombre, precio: t.precio, tallas: t.tallas, acepta_personalizacion: t.aceptaPersonalizacion, es_short: t.esShort, orden: t.orden }), 'tipo')
  },
  async guardarCombo(c) { ok(await sb().from('combos').upsert({ id: c.id, nombre: c.nombre, precio: c.precio, activo: c.activo, tipos: c.tipos }), 'combo') },
  async guardarParche(p) { ok(await sb().from('parches').upsert({ id: p.id, nombre: p.nombre, precio: p.precio, activo: p.activo }), 'parche') },
  async guardarAjustes(a) { ok(await sb().from('ajustes').upsert({ id: 1, datos: a }), 'ajustes') },
  async crearStock(s) {
    ok(await sb().from('stock').insert({ id: s.id, producto_id: s.productoId, talla: s.talla, cantidad: s.cantidad, precio: s.precio }), 'stock')
  },
  // sumar_stock() (migración 0006) suma en la base: un pedido que entra al mismo tiempo no se pierde.
  async sumarStock(id, delta) { ok(await sb().rpc('sumar_stock', { p_id: id, p_delta: delta }), 'sumar stock') },
  async precioStock(id, precio) { ok(await sb().from('stock').update({ precio }).eq('id', id), 'precio stock') },
  async eliminarStock(id) { ok(await sb().from('stock').delete().eq('id', id), 'eliminar stock') },

  async registrarEvento(e: EventoGuardado) {
    ok(await sb().from('eventos').insert({
      tipo: e.tipo, ruta: e.ruta, producto_id: e.productoId, termino: e.termino, visitante: e.visitante,
      fuente: e.fuente, dispositivo: e.dispositivo, creado_en: new Date(e.creadoEn).toISOString(),
    }), 'evento')
  },
  async eventos(desde, hasta) {
    // Solo las columnas que usa el Resumen; con poco tráfico esto es liviano.
    const filas = datos(await sb().from('eventos').select('tipo,ruta,producto_id,termino,visitante,fuente,dispositivo,creado_en')
      .gte('creado_en', new Date(desde).toISOString()).lte('creado_en', new Date(hasta).toISOString()).limit(50000), 'eventos')
    return filas.map(f => ({
      tipo: f.tipo, ruta: f.ruta, productoId: f.producto_id, termino: f.termino, visitante: f.visitante,
      fuente: f.fuente, dispositivo: f.dispositivo, creadoEn: +new Date(f.creado_en),
    }) as EventoGuardado)
  },

  async contarIntentos(clave, desde) {
    const r = await sb().from('intentos').select('id', { count: 'exact', head: true }).eq('clave', clave).gte('creado_en', new Date(desde).toISOString())
    ok(r, 'contar intentos')
    return r.count ?? 0
  },
  async registrarIntento(clave) { ok(await sb().from('intentos').insert({ clave }), 'intento') },

  async subirFoto(ruta, datos) {
    ok(await sb().storage.from('fotos').upload(ruta, datos, { contentType: 'image/webp', upsert: false, cacheControl: '31536000' }), 'subir foto')
    return sb().storage.from('fotos').getPublicUrl(ruta).data.publicUrl
  },
  async eliminarLiga(id) {
    // equipos y productos se borran en cascada (migración 0005): todo o nada.
    ok(await sb().from('ligas').delete().eq('id', id), 'eliminar liga')
  },
  async borrarCarpetas(carpetas) {
    const bucket = sb().storage.from('fotos')
    for (const carpeta of carpetas) {
      const lista = ok(await bucket.list(carpeta, { limit: 100 }), 'listar fotos') ?? []
      const rutas = lista.filter(a => a.id).map(a => `${carpeta}/${a.name}`)
      if (rutas.length) ok(await bucket.remove(rutas), 'borrar fotos')
    }
  },

  async ping() { ok(await sb().from('ajustes').select('id').eq('id', 1), 'ping') },
  async reiniciar() { throw new ErrorNegocio('Solo disponible en modo de prueba.') },
}
