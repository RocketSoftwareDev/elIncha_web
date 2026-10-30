import { z } from 'zod'
import { COOKIE_ADMIN } from '@/lib/auth/sesion'
import { esBot } from '@/lib/domain/analitica'
import { registrarEvento } from '@/lib/data/estadisticas'
import { ipCliente } from '@/lib/ip'

// Recibe los avisos del navegador (sendBeacon). Nunca falla hacia el cliente:
// si algo está mal responde 204 igual y no guarda nada.

const evento = z.object({
  tipo: z.enum(['vista', 'agregar_carrito', 'busqueda_vacia']),
  ruta: z.string().max(120).startsWith('/').optional(),
  productoId: z.string().max(64).optional(),
  termino: z.string().max(60).optional(),
  referrer: z.string().max(300).optional(),
  utmSource: z.string().max(40).optional(),
})

const vacio = () => new Response(null, { status: 204 })

export async function POST(req: Request) {
  const userAgent = req.headers.get('user-agent') ?? ''
  // Bots que se identifican y visitas del dueño (sesión de admin) no cuentan.
  if (esBot(userAgent) || req.headers.get('cookie')?.includes(`${COOKIE_ADMIN}=`)) return vacio()
  if (Number(req.headers.get('content-length') ?? 0) > 2000) return vacio()

  try {
    const e = evento.safeParse(JSON.parse(await req.text()))
    if (!e.success || (e.data.tipo === 'busqueda_vacia' && !e.data.termino)) return vacio()
    await registrarEvento(e.data, { ip: ipCliente(req.headers), userAgent: userAgent.slice(0, 400) })
  } catch (err) {
    console.error('[evento]', err)
  }
  return vacio()
}
