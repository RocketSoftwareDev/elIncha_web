// Estadísticas propias, sin cookies. Mismas reglas que el back
// (elIncha_back/src/services/analitica.ts): aquí sirven para el modo de prueba.

export type TipoEvento = 'vista' | 'agregar_carrito' | 'busqueda_vacia'
export type Fuente = 'instagram' | 'google' | 'whatsapp' | 'facebook' | 'directo' | 'otro'
export type Dispositivo = 'celular' | 'computadora'
export type Rango = 'hoy' | '7d' | '30d' | 'drop'

export const RANGOS: { valor: Rango; etiqueta: string }[] = [
  { valor: 'hoy', etiqueta: 'Hoy' },
  { valor: '7d', etiqueta: '7 días' },
  { valor: '30d', etiqueta: '30 días' },
  { valor: 'drop', etiqueta: 'Drop actual' },
]

/** Lo que manda el navegador. La IP y el navegador los agrega el servidor. */
export interface EventoEntrada {
  tipo: TipoEvento
  ruta?: string
  productoId?: string
  termino?: string
  referrer?: string
  utmSource?: string
}

/** Contrato de GET /admin/estadisticas del back. */
export interface Estadisticas {
  rango: { desde: string; hasta: string; etiqueta: string }
  kpis: { visitas: number; visitantes: number; carrito: number; pedidos: number; reservasPagadas: number; visitasAnterior: number | null }
  serie: { fecha: string; visitas: number; pedidos: number }[]
  fuentes: { fuente: Fuente; visitas: number }[]
  dispositivos: { celular: number; computadora: number }
  top: { productoId: string; nombre: string; equipo: string; liga: string; tipo: string; foto: string | null; visitas: number; carrito: number; pedidos: number }[]
  busquedasVacias: { termino: string; veces: number }[]
}

const BOTS = /bot|spider|crawl|slurp|facebookexternalhit|whatsapp\/|twitterbot|slackbot|discordbot|telegrambot|ahrefs|semrush|curl|wget|python-requests|headless|lighthouse/i

/** Solo se descartan los bots que se identifican: el plan gratis de Cloudflare no da puntaje de bots. */
export function esBot(ua: string | null | undefined): boolean {
  return !ua || BOTS.test(ua)
}

export function dispositivo(ua: string): Dispositivo {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? 'celular' : 'computadora'
}

const POR_UTM: [RegExp, Fuente][] = [
  [/^(instagram|ig)$/, 'instagram'],
  [/^(whatsapp|wa|wsp)$/, 'whatsapp'],
  [/^(facebook|fb)$/, 'facebook'],
  [/^google$/, 'google'],
]

/**
 * El enlace etiquetado (?utm_source=) manda; si no hay, la página de origen.
 * WhatsApp casi nunca informa el origen: sin etiqueta queda como «directo».
 */
export function clasificarFuente({ utmSource, referrer }: { utmSource?: string; referrer?: string }, sitio = 'elhinchamachala.com'): Fuente {
  const utm = utmSource?.trim().toLowerCase()
  if (utm) return POR_UTM.find(([re]) => re.test(utm))?.[1] ?? 'otro'
  if (!referrer) return 'directo'
  let host: string
  try {
    host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return 'directo'
  }
  if (host === sitio || host === 'localhost') return 'directo'
  if (/(^|\.)instagram\.com$/.test(host)) return 'instagram'
  if (/(^|\.)google\.[a-z.]+$/.test(host)) return 'google'
  if (/(^|\.)facebook\.com$/.test(host)) return 'facebook'
  if (host === 'wa.me' || /(^|\.)whatsapp\.com$/.test(host)) return 'whatsapp'
  return 'otro'
}

export function normalizarTermino(q: string): string {
  return q.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 60)
}

/** «x de y» como porcentaje con una decimal y coma: 3,7 %. */
export function porcentaje(x: number, de: number): string {
  if (!de) return '0 %'
  const p = (x / de) * 100
  return `${(p < 10 ? p.toFixed(1) : Math.round(p).toString()).replace('.', ',')} %`
}

/** Mucha visita y poca venta: vale la pena revisar foto, precio o tallas. */
export function convierteMal(visitas: number, pedidos: number, promedio: number): boolean {
  return visitas >= 50 && pedidos / visitas < promedio * 0.5
}
