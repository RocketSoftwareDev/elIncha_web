import { requerirAdmin } from '@/lib/auth/sesion'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { FormProducto } from '@/components/admin/FormProducto'
import { listarEquipos, listarLigas, listarParches, listarTipos, modoPrueba, productoPorId } from '@/lib/data/admin'

export const metadata: Metadata = { title: 'Editar camiseta' }

export default async function EditarCamiseta({ params }: { params: Promise<{ id: string }> }) {
  // El layout no basta: Next genera la página en paralelo. Se verifica aquí también.
  await requerirAdmin()
  const { id } = await params
  const producto = await productoPorId(id)
  if (!producto) notFound()
  const [ligas, equipos, tipos, parches] = await Promise.all([listarLigas(), listarEquipos(), listarTipos(), listarParches()])
  return <FormProducto ligas={ligas} equipos={equipos} tipos={tipos} parches={parches.filter(p => p.activo)} producto={producto} subirFotos={!modoPrueba()} />
}
