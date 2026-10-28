import { z } from 'zod'
import { esBot } from '@/lib/domain/analitica'
import { registrarEvento } from '@/lib/data/estadisticas'

// Recibe los avisos del navegador (sendBeacon) y los pasa a la API. Nunca falla
// hacia el cliente: si algo está mal, responde 204 igual y no guarda nada.

const evento = z.object({
  tipo: z.enum(['vista', 'agregar_carrito', 'busqueda_vacia']),
  ruta: z.string().max(120).startsWith('/').optional(),
  productoId: z.string().max(64).optional(),
  termino: z.string().max(60).optional(),
  referrer: z.string().max(300).optional(),
  utmSource: z.string().max(40).optional(),
})

/** Las visitas del dueño (sesión de admin abierta) no cuentan. */
const COOKIE_ADMIN = 'eh_admin'

const vacio = () => new Response(null, { status: 204 })

export async function POST(req: Request) {
  const userAgent = req.headers.get('user-agent') ?? ''
  if (esBot(userAgent) || req.headers.get('cookie')?.includes(`${COOKIE_ADMIN}=`)) return vacio()

  let cuerpo: unknown
  try {
    cuerpo = JSON.parse(await req.text())
  } catch {
    return vacio()
  }
  const e = evento.safeParse(cuerpo)
  if (!e.success || (e.data.tipo === 'busqueda_vacia' && !e.data.termino)) return vacio()

  // Detrás de Cloudflare la IP real llega en CF-Connecting-IP. No se guarda: solo
  // sirve para el identificador anónimo del día y para el límite de la API.
  const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local'
  await registrarEvento(e.data, { ip, userAgent })
  return vacio()
}
