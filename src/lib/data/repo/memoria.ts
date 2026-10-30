import 'server-only'

// Almacenamiento en memoria para desarrollo local. Se reinicia con el servidor.

import type { Dispositivo, Fuente } from '@/lib/domain/analitica'
import { db, reiniciarDatos } from '../mock-db'
import { ErrorNegocio, type EventoGuardado, type Repo } from './tipos'

const DIA = 86400000

/** Visitas sintéticas del drop actual, siempre iguales, para que el Resumen se lea. */
function eventosSinteticos(): EventoGuardado[] {
  let s = 7
  const azar = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648)
  const elegir = <T,>(pares: [T, number][]) => {
    let r = azar() * pares.reduce((a, [, p]) => a + p, 0)
    for (const [v, p] of pares) if ((r -= p) <= 0) return v
    return pares[0][0]
  }
  const drop = db.drops.find(d => d.estado === 'abierto') ?? db.drops[0]
  const inicio = new Date(drop.abreEn).getTime()
  const productos = db.productos.filter(p => p.visible)
  const pesos: Record<string, number> = { 'pr-emelec-local-2025': 9, 'pr-bayern-local-25-26': 6, 'pr-real-madrid-local-25-26': 5.5, 'pr-ecuador-mundial-2002': 4.5, 'pr-barcelona-local-25-26': 4, 'pr-ldu-local-2025': 3.5 }
  const conviertePoco = new Set(['pr-emelec-local-2025', 'pr-ldu-local-2025'])
  const eventos: EventoGuardado[] = []

  for (let d = 0; d < 28; d++) {
    const visitasDia = Math.round(22 + d * 2.2 + (d > 22 ? (d - 22) ** 2 * 9 : 0))
    for (let i = 0; i < visitasDia; i++) {
      const t = inicio + d * DIA + Math.floor(azar() * DIA)
      const base = {
        visitante: (d * 1000 + Math.floor(i / 2)).toString(16).padStart(16, '0'),
        fuente: elegir<Fuente>([['instagram', 54], ['directo', 24], ['whatsapp', 8], ['google', 10], ['facebook', 3], ['otro', 1]]),
        dispositivo: elegir<Dispositivo>([['celular', 87], ['computadora', 13]]),
        termino: null,
      }
      const p = elegir(productos.map(x => [x, pesos[x.id] ?? 1] as [typeof x, number]))
      const enProducto = azar() < 0.62
      eventos.push({ ...base, tipo: 'vista', ruta: enProducto ? `/producto/${p.slug}` : elegir([['/', 3], ['/vitrina', 5]]), productoId: enProducto ? p.id : null, creadoEn: t })
      if (enProducto && azar() < (conviertePoco.has(p.id) ? 0.07 : 0.14)) {
        eventos.push({ ...base, tipo: 'agregar_carrito', ruta: `/producto/${p.slug}`, productoId: p.id, creadoEn: t + 60000 })
      }
    }
  }
  const busquedas: [string, number][] = [['liga de loja', 23], ['juventus', 17], ['orense', 14], ['inter de milan', 11], ['seleccion colombia', 8], ['camiseta de nino', 6]]
  for (const [termino, veces] of busquedas) {
    for (let i = 0; i < veces; i++) {
      eventos.push({ tipo: 'busqueda_vacia', ruta: '/vitrina', productoId: null, termino, visitante: (900000 + i).toString(16).padStart(16, '0'), fuente: 'directo', dispositivo: 'celular', creadoEn: inicio + Math.floor(azar() * 27 * DIA) })
    }
  }
  return eventos
}

const g = globalThis as unknown as { __ehEventos?: EventoGuardado[]; __ehIntentos?: { clave: string; t: number }[] }
const eventos = (g.__ehEventos ??= eventosSinteticos())
const intentos = (g.__ehIntentos ??= [])

const reemplazar = <T extends { id: string }>(lista: T[], x: T) => {
  const i = lista.findIndex(y => y.id === x.id)
  if (i >= 0) lista[i] = x
  else lista.push(x)
}

export const repoMemoria: Repo = {
  modo: 'prueba',
  async catalogo() {
    return db
  },

  async pedidos(f = {}) {
    return db.pedidos.filter(p =>
      (!f.dropId || p.dropId === f.dropId) &&
      (!f.estado || p.estado === f.estado) &&
      (f.desde === undefined || +new Date(p.creadoEn) >= f.desde) &&
      (f.hasta === undefined || +new Date(p.creadoEn) <= f.hasta))
  },
  async pedidoPorCodigo(codigo) {
    return db.pedidos.find(p => p.codigo === codigo) ?? null
  },
  async crearPedido(p) {
    const codigo = `EH-${String(++db.secuenciaPedido).padStart(4, '0')}`
    db.pedidos.unshift({ ...p, id: crypto.randomUUID(), codigo, creadoEn: new Date().toISOString() })
    return { codigo }
  },
  async cambiarEstadoPedido(codigo, estado) {
    const p = db.pedidos.find(x => x.codigo === codigo)
    if (!p) throw new ErrorNegocio('Pedido no encontrado')
    p.estado = estado
  },

  async guardarDrop(d) {
    if (d.estado === 'abierto' && db.drops.some(x => x.estado === 'abierto' && x.id !== d.id)) {
      throw new ErrorNegocio('Ya hay un drop abierto. Ciérralo antes de abrir otro.')
    }
    reemplazar(db.drops, d)
  },
  async guardarLiga(l) { reemplazar(db.ligas, l) },
  async guardarEquipo(e) { reemplazar(db.equipos, e) },
  async guardarProducto(p) { reemplazar(db.productos, p) },
  async guardarTipo(t) { reemplazar(db.tipos, t) },
  async guardarCombo(c) { reemplazar(db.combos, c) },
  async guardarParche(p) { reemplazar(db.parches, p) },
  async guardarAjustes(a) { db.ajustes = a },

  async registrarEvento(e) {
    eventos.push(e)
    while (eventos.length && eventos[0].creadoEn < Date.now() - 180 * DIA) eventos.shift()
  },
  async eventos(desde, hasta) {
    return eventos.filter(e => e.creadoEn >= desde && e.creadoEn <= hasta)
  },

  async contarIntentos(clave, desde) {
    return intentos.filter(x => x.clave === clave && x.t >= desde).length
  },
  async registrarIntento(clave) {
    intentos.push({ clave, t: Date.now() })
    while (intentos.length > 5000) intentos.shift()
  },

  async eliminarLiga(id) {
    const equipos = new Set(db.equipos.filter(e => e.ligaId === id).map(e => e.id))
    db.productos = db.productos.filter(p => !equipos.has(p.equipoId))
    db.equipos = db.equipos.filter(e => e.ligaId !== id)
    db.ligas = db.ligas.filter(l => l.id !== id)
  },

  async subirFoto() {
    throw new ErrorNegocio('En modo de prueba no se suben fotos: configura Supabase.')
  },
  async borrarCarpetas() {},
  async ping() {},
  async reiniciar() {
    reiniciarDatos()
    eventos.splice(0, eventos.length, ...eventosSinteticos())
    intentos.length = 0
  },
}
