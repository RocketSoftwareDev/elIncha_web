import type { Metadata } from 'next'
import { FormProducto } from '@/components/admin/FormProducto'
import { listarEquipos, listarLigas, listarParches, listarTipos } from '@/lib/data/admin'

export const metadata: Metadata = { title: 'Nueva camiseta' }

export default async function NuevaCamiseta() {
  const [ligas, equipos, tipos, parches] = await Promise.all([listarLigas(), listarEquipos(), listarTipos(), listarParches()])
  return <FormProducto ligas={ligas} equipos={equipos} tipos={tipos} parches={parches.filter(p => p.activo)} producto={null} />
}
