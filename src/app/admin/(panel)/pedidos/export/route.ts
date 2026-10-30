import { sesionValida } from '@/lib/auth/sesion'
import { listaProveedorCsv, listarDrops } from '@/lib/data/admin'

// Lista para el proveedor: una fila por prenda, lista para abrir en Excel.
// Las rutas no pasan por el layout del admin: la sesión se verifica aquí.
export async function GET(req: Request) {
  if (!(await sesionValida())) return new Response('No autorizado', { status: 401 })
  const drops = await listarDrops()
  const pedido = new URL(req.url).searchParams.get('drop')
  const drop = drops.find(d => d.id === pedido) ?? drops.find(d => d.estado === 'abierto') ?? drops[0]
  if (!drop) return new Response('No hay drops', { status: 404 })

  const csv = await listaProveedorCsv(drop.id)
  const archivo = `proveedor-${drop.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`
  // BOM para que Excel respete Ñ y tildes.
  return new Response(`﻿${csv}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${archivo}"`,
      'Cache-Control': 'no-store',
    },
  })
}
