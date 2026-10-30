import { requerirAdmin } from '@/lib/auth/sesion'
import type { Metadata } from 'next'
import { FormProducto } from '@/components/admin/FormProducto'
import { listarEquipos, listarLigas, listarParches, listarTipos, modoPrueba } from '@/lib/data/admin'

export const metadata: Metadata = { title: 'Nueva camiseta' }

export default async function NuevaCamiseta() {
  // El layout no basta: Next genera la página en paralelo. Se verifica aquí también.
  await requerirAdmin()
  const [ligas, equipos, tipos, parches] = await Promise.all([listarLigas(), listarEquipos(), listarTipos(), listarParches()])
  return <FormProducto ligas={ligas} equipos={equipos} tipos={tipos} parches={parches.filter(p => p.activo)} producto={null} subirFotos={!modoPrueba()} />
}
