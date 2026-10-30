import 'server-only'

// Estadísticas propias, sin cookies. Los eventos se guardan en el repositorio
// (Supabase o memoria) y el Resumen se calcula aquí con las mismas definiciones
// que el back del VPS (GET /admin/estadisticas).

import { createHash } from 'node:crypto'
import {
  clasificarFuente, dispositivo, normalizarTermino,
  type Estadisticas, type EventoEntrada, type Rango,
} from '@/lib/domain/analitica'
import { ZONA } from '@/lib/domain/drop'
import { catalogo, repo, type EventoGuardado } from './repo'

const DIA = 86400000
/** Tope de avisos por visitante: frena a quien quiera inflar números o llenar la base. */
const MAX_EVENTOS = 60
const VENTANA = 10 * 60 * 1000

const diaEc = (t: number) => new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(new Date(t)) // YYYY-MM-DD

/**
 * Identificador anónimo del día. Lleva un secreto del servidor: sin él, alguien con
 * acceso a la base podría probar todas las IP y deshacer el cálculo.
 */
function visitante(ip: string, ua: string, t: number) {
  const secreto = process.env.SESSION_SECRET ?? 'solo-desarrollo-local'
  return createHash('sha256').update(`${secreto}|${diaEc(t)}|${ip}|${ua}`).digest('hex').slice(0, 16)
}

// ---------- Registrar ----------

export async function registrarEvento(e: EventoEntrada, contexto: { ip: string; userAgent: string }) {
  const ahora = Date.now()
  const id = visitante(contexto.ip, contexto.userAgent, ahora)
  const clave = `evento:${id}`
  if ((await repo.contarIntentos(clave, ahora - VENTANA)) >= MAX_EVENTOS) return
  await repo.registrarIntento(clave)
  await repo.registrarEvento({
    tipo: e.tipo,
    ruta: e.ruta?.split(/[?#]/)[0] ?? null,
    productoId: e.productoId ?? null,
    termino: e.tipo === 'busqueda_vacia' && e.termino ? normalizarTermino(e.termino) : null,
    visitante: id,
    fuente: clasificarFuente(e, process.env.SITIO_HOST),
    dispositivo: dispositivo(contexto.userAgent),
    creadoEn: ahora,
  })
}

// ---------- Calcular ----------

async function periodo(rango: Rango, ahora: number) {
  if (rango === 'drop') {
    const drops = [...(await catalogo()).drops].filter(d => d.estado !== 'borrador').sort((a, b) => b.abreEn.localeCompare(a.abreEn))
    const actual = drops.find(d => d.estado === 'abierto') ?? drops[0]
    if (actual) {
      const previo = drops[drops.indexOf(actual) + 1]
      return {
        desde: new Date(actual.abreEn).getTime(),
        hasta: Math.min(ahora, new Date(actual.cierraEn).getTime()),
        etiqueta: actual.nombre,
        anterior: previo ? { desde: new Date(previo.abreEn).getTime(), hasta: new Date(previo.cierraEn).getTime() } : null,
      }
    }
    // Sin ningún drop todavía: se muestran los últimos 30 días.
    rango = '30d'
  }
  const dias = rango === 'hoy' ? 1 : rango === '7d' ? 7 : 30
  // Inicio del día en Ecuador (UTC−5, sin horario de verano).
  const hoy = new Date(`${diaEc(ahora)}T00:00:00-05:00`).getTime()
  const desde = hoy - (dias - 1) * DIA
  return { desde, hasta: ahora, etiqueta: rango === 'hoy' ? 'Hoy' : `Últimos ${dias} días`, anterior: { desde: desde - dias * DIA, hasta: desde } }
}

const contarPor = <K extends string>(xs: EventoGuardado[], clave: (e: EventoGuardado) => K) => {
  const m = new Map<K, number>()
  for (const e of xs) m.set(clave(e), (m.get(clave(e)) ?? 0) + 1)
  return m
}

export async function estadisticas(rango: Rango): Promise<Estadisticas> {
  const ahora = Date.now()
  const p = await periodo(rango, ahora)
  const prueba = repo.modo === 'prueba'
  const [enRango, pedidos, c, anterior] = await Promise.all([
    repo.eventos(p.desde, p.hasta),
    repo.pedidos({ desde: p.desde, hasta: p.hasta }).then(xs => xs.filter(x => x.estado !== 'cancelado')),
    catalogo(),
    p.anterior ? repo.eventos(p.anterior.desde, p.anterior.hasta) : Promise.resolve([]),
  ])
  const vistas = enRango.filter(e => e.tipo === 'vista')
  const carrito = enRango.filter(e => e.tipo === 'agregar_carrito')

  // Serie diaria con días vacíos en cero.
  const vistasPorDia = contarPor(vistas, e => diaEc(e.creadoEn))
  const pedidosPorDia = new Map<string, number>()
  for (const x of pedidos) pedidosPorDia.set(diaEc(+new Date(x.creadoEn)), (pedidosPorDia.get(diaEc(+new Date(x.creadoEn))) ?? 0) + 1)
  const serie: Estadisticas['serie'] = []
  for (let t = p.desde; diaEc(t) <= diaEc(p.hasta); t += DIA) {
    const f = diaEc(t)
    const v = vistasPorDia.get(f) ?? 0
    // En modo de prueba hay pocos pedidos: los días sin pedido se estiman para que el gráfico se lea.
    serie.push({ fecha: f, visitas: v, pedidos: pedidosPorDia.get(f) ?? (prueba ? Math.round(v / 45) : 0) })
  }

  const vistasProducto = contarPor(vistas.filter(e => e.productoId), e => e.productoId!)
  const carritoProducto = contarPor(carrito.filter(e => e.productoId), e => e.productoId!)
  const pedidosProducto = new Map<string, number>()
  for (const x of pedidos) for (const i of x.items) if (i.productoId) pedidosProducto.set(i.productoId, (pedidosProducto.get(i.productoId) ?? 0) + i.cantidad)
  if (prueba) for (const [id, n] of carritoProducto) if (!pedidosProducto.has(id)) pedidosProducto.set(id, Math.round(n * 0.3))

  const top = [...vistasProducto.entries()]
    .sort((a, b) => b[1] - a[1])
    .flatMap(([id, visitas]) => {
      const pr = c.productos.find(x => x.id === id)
      const eq = pr && c.equipos.find(x => x.id === pr.equipoId)
      if (!pr || !eq) return []
      return [{
        productoId: id,
        nombre: pr.nombre,
        equipo: eq.nombre,
        liga: c.ligas.find(l => l.id === eq.ligaId)?.nombre ?? '',
        tipo: c.tipos.find(t => t.id === pr.tipoId)?.nombre ?? '',
        foto: pr.fotos[0] ?? null,
        visitas,
        carrito: carritoProducto.get(id) ?? 0,
        pedidos: pedidosProducto.get(id) ?? 0,
      }]
    })
    .slice(0, 10)

  const estimados = prueba ? top.reduce((s, x) => s + x.pedidos, 0) : 0
  const usaEstimados = estimados > pedidos.length
  const visitasAnterior = anterior.filter(e => e.tipo === 'vista').length

  return {
    rango: { desde: new Date(p.desde).toISOString(), hasta: new Date(p.hasta).toISOString(), etiqueta: p.etiqueta },
    kpis: {
      visitas: vistas.length,
      visitantes: new Set(vistas.map(e => e.visitante)).size,
      carrito: carrito.length,
      pedidos: usaEstimados ? estimados : pedidos.length,
      reservasPagadas: usaEstimados ? Math.round(estimados * 0.7) : pedidos.filter(x => x.estado !== 'por_confirmar').length,
      visitasAnterior: visitasAnterior || null,
    },
    serie,
    fuentes: [...contarPor(vistas, e => e.fuente).entries()].map(([fuente, visitas]) => ({ fuente, visitas })).sort((a, b) => b.visitas - a.visitas),
    dispositivos: { celular: vistas.filter(e => e.dispositivo === 'celular').length, computadora: vistas.filter(e => e.dispositivo === 'computadora').length },
    top,
    busquedasVacias: [...contarPor(enRango.filter(e => e.tipo === 'busqueda_vacia' && e.termino), e => e.termino!).entries()]
      .map(([termino, veces]) => ({ termino, veces }))
      .sort((a, b) => b.veces - a.veces)
      .slice(0, 10),
  }
}
