import 'server-only'

// Estadísticas en modo de prueba: eventos en memoria + una semilla sintética del
// drop actual. Con el back conectado, `registrarEvento` llama a POST /eventos y
// `estadisticas` a GET /admin/estadisticas (mismo contrato: lib/domain/analitica).

import { createHash } from 'node:crypto'
import {
  clasificarFuente, dispositivo, normalizarTermino,
  type Dispositivo, type Estadisticas, type EventoEntrada, type Fuente, type Rango, type TipoEvento,
} from '@/lib/domain/analitica'
import { ZONA } from '@/lib/domain/drop'
import { db } from './mock-db'

interface Evento {
  tipo: TipoEvento
  ruta: string | null
  productoId: string | null
  termino: string | null
  visitante: string
  fuente: Fuente
  dispositivo: Dispositivo
  creadoEn: number
}

const DIA = 86400000
const RETENCION = 180 * DIA

const diaEc = (t: number) => new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(new Date(t)) // YYYY-MM-DD

/** Identificador anónimo del día: no guarda IP ni navegador, y cambia cada día. */
function visitante(ip: string, ua: string, t: number) {
  return createHash('sha256').update(`${diaEc(t)}|${ip}|${ua}`).digest('hex').slice(0, 16)
}

// ---------- Semilla sintética (determinista) ----------

function semilla(): Evento[] {
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
  // Popularidad por producto: algunos se miran mucho y venden poco (para que se note en el Resumen).
  const peso = (id: string) => ({ 'pr-emelec-local-2025': 9, 'pr-bayern-local-25-26': 6, 'pr-real-madrid-local-25-26': 5.5, 'pr-ecuador-mundial-2002': 4.5, 'pr-barcelona-local-25-26': 4, 'pr-ldu-local-2025': 3.5 } as Record<string, number>)[id] ?? 1
  const conviertePoco = new Set(['pr-emelec-local-2025', 'pr-ldu-local-2025'])
  const eventos: Evento[] = []

  for (let d = 0; d < 28; d++) {
    const visitasDia = Math.round(22 + d * 2.2 + (d > 22 ? (d - 22) ** 2 * 9 : 0))
    for (let i = 0; i < visitasDia; i++) {
      const t = inicio + d * DIA + Math.floor(azar() * DIA)
      const base = {
        visitante: `sint${d}-${Math.floor(i / 2)}`, // ~2 vistas por visitante
        fuente: elegir<Fuente>([['instagram', 54], ['directo', 24], ['whatsapp', 8], ['google', 10], ['facebook', 3], ['otro', 1]]),
        dispositivo: elegir<Dispositivo>([['celular', 87], ['computadora', 13]]),
        termino: null,
      }
      const p = elegir(productos.map(x => [x, peso(x.id)] as [typeof x, number]))
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
      eventos.push({ tipo: 'busqueda_vacia', ruta: '/vitrina', productoId: null, termino, visitante: `b-${termino}-${i}`, fuente: 'directo', dispositivo: 'celular', creadoEn: inicio + Math.floor(azar() * 27 * DIA) })
    }
  }
  return eventos
}

const g = globalThis as unknown as { __elhinchaEventos?: Evento[] }
const eventos: Evento[] = (g.__elhinchaEventos ??= semilla())

/** Modo de prueba: vuelve a la semilla (lo usa «Reiniciar datos» del admin). */
export function reiniciarEventos() {
  eventos.splice(0, eventos.length, ...semilla())
}

// ---------- Registrar ----------

export async function registrarEvento(e: EventoEntrada, contexto: { ip: string; userAgent: string }) {
  const ahora = Date.now()
  eventos.push({
    tipo: e.tipo,
    ruta: e.ruta ?? null,
    productoId: e.productoId ?? null,
    termino: e.termino ? normalizarTermino(e.termino) : null,
    visitante: visitante(contexto.ip, contexto.userAgent, ahora),
    fuente: clasificarFuente(e),
    dispositivo: dispositivo(contexto.userAgent),
    creadoEn: ahora,
  })
  // Retención: lo mismo que hará el back cada día.
  while (eventos.length && eventos[0].creadoEn < ahora - RETENCION) eventos.shift()
}

// ---------- Calcular ----------

function periodo(rango: Rango, ahora: number): { desde: number; hasta: number; etiqueta: string; anterior: { desde: number; hasta: number } | null } {
  if (rango === 'drop') {
    const drops = [...db.drops].sort((a, b) => b.abreEn.localeCompare(a.abreEn))
    const actual = drops.find(d => d.estado === 'abierto') ?? drops[0]
    const previo = drops[drops.indexOf(actual) + 1]
    return {
      desde: new Date(actual.abreEn).getTime(),
      hasta: Math.min(ahora, new Date(actual.cierraEn).getTime()),
      etiqueta: actual.nombre,
      anterior: previo ? { desde: new Date(previo.abreEn).getTime(), hasta: new Date(previo.cierraEn).getTime() } : null,
    }
  }
  const dias = rango === 'hoy' ? 1 : rango === '7d' ? 7 : 30
  // Inicio del día en Ecuador (UTC−5, sin horario de verano).
  const hoy = new Date(`${diaEc(ahora)}T00:00:00-05:00`).getTime()
  const desde = hoy - (dias - 1) * DIA
  return { desde, hasta: ahora, etiqueta: rango === 'hoy' ? 'Hoy' : `Últimos ${dias} días`, anterior: { desde: desde - dias * DIA, hasta: desde } }
}

const contarPor = <K extends string>(xs: Evento[], clave: (e: Evento) => K) => {
  const m = new Map<K, number>()
  for (const e of xs) m.set(clave(e), (m.get(clave(e)) ?? 0) + 1)
  return m
}

export async function estadisticas(rango: Rango): Promise<Estadisticas> {
  const ahora = Date.now()
  const p = periodo(rango, ahora)
  const enRango = eventos.filter(e => e.creadoEn >= p.desde && e.creadoEn <= p.hasta)
  const vistas = enRango.filter(e => e.tipo === 'vista')
  const carrito = enRango.filter(e => e.tipo === 'agregar_carrito')
  const pedidos = db.pedidos.filter(x => x.estado !== 'cancelado' && +new Date(x.creadoEn) >= p.desde && +new Date(x.creadoEn) <= p.hasta)

  // Serie diaria con días vacíos en cero.
  const serie: Estadisticas['serie'] = []
  const vistasPorDia = contarPor(vistas, e => diaEc(e.creadoEn))
  const pedidosPorDia = new Map<string, number>()
  for (const x of pedidos) pedidosPorDia.set(diaEc(+new Date(x.creadoEn)), (pedidosPorDia.get(diaEc(+new Date(x.creadoEn))) ?? 0) + 1)
  for (let t = p.desde; diaEc(t) <= diaEc(p.hasta); t += DIA) {
    const f = diaEc(t)
    const v = vistasPorDia.get(f) ?? 0
    // Los pedidos de prueba son pocos: los días sin pedido real se estiman para que el gráfico se lea.
    serie.push({ fecha: f, visitas: v, pedidos: pedidosPorDia.get(f) ?? Math.round(v / 45) })
  }

  // En modo de prueba los pedidos sintéticos se reparten según las vistas, para que el top tenga sentido.
  const vistasProducto = contarPor(vistas.filter(e => e.productoId), e => e.productoId!)
  const carritoProducto = contarPor(carrito.filter(e => e.productoId), e => e.productoId!)
  const pedidosProducto = new Map<string, number>()
  for (const x of pedidos) for (const i of x.items) if (i.productoId) pedidosProducto.set(i.productoId, (pedidosProducto.get(i.productoId) ?? 0) + i.cantidad)
  for (const [id, n] of carritoProducto) if (!pedidosProducto.has(id)) pedidosProducto.set(id, Math.round(n * 0.3))

  const top = [...vistasProducto.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, visitas]) => {
      const pr = db.productos.find(x => x.id === id)!
      const eq = db.equipos.find(x => x.id === pr.equipoId)!
      return {
        productoId: id,
        nombre: pr.nombre,
        equipo: eq.nombre,
        liga: db.ligas.find(l => l.id === eq.ligaId)!.nombre,
        tipo: db.tipos.find(t => t.id === pr.tipoId)!.nombre,
        foto: pr.fotos[0] ?? null,
        visitas,
        carrito: carritoProducto.get(id) ?? 0,
        pedidos: pedidosProducto.get(id) ?? 0,
      }
    })

  const sinteticos = top.reduce((s, x) => s + x.pedidos, 0)
  const anterior = p.anterior ? eventos.filter(e => e.tipo === 'vista' && e.creadoEn >= p.anterior!.desde && e.creadoEn <= p.anterior!.hasta).length : 0

  return {
    rango: { desde: new Date(p.desde).toISOString(), hasta: new Date(p.hasta).toISOString(), etiqueta: p.etiqueta },
    kpis: {
      visitas: vistas.length,
      visitantes: new Set(vistas.map(e => e.visitante)).size,
      carrito: carrito.length,
      // Con pocos pedidos de prueba se usan los estimados, y las reservas en la misma proporción.
      pedidos: Math.max(pedidos.length, sinteticos),
      reservasPagadas: sinteticos > pedidos.length ? Math.round(sinteticos * 0.7) : pedidos.filter(x => x.estado !== 'por_confirmar').length,
      visitasAnterior: anterior || null,
    },
    serie,
    fuentes: [...contarPor(vistas, e => e.fuente).entries()].map(([fuente, visitas]) => ({ fuente, visitas })).sort((a, b) => b.visitas - a.visitas),
    dispositivos: { celular: vistas.filter(e => e.dispositivo === 'celular').length, computadora: vistas.filter(e => e.dispositivo === 'computadora').length },
    top,
    busquedasVacias: [...contarPor(enRango.filter(e => e.tipo === 'busqueda_vacia'), e => e.termino!).entries()]
      .map(([termino, veces]) => ({ termino, veces }))
      .sort((a, b) => b.veces - a.veces)
      .slice(0, 10),
  }
}
