'use server'

import { revalidatePath } from 'next/cache'
import { crearPedido, type ResultadoPedido } from '@/lib/data/tienda'

export async function enviarPedido(entrada: unknown): Promise<ResultadoPedido> {
  const r = await crearPedido(entrada)
  if (r.ok) revalidatePath('/admin', 'layout')
  return r
}
