'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { crearPedido, type ResultadoPedido } from '@/lib/data/tienda'
import { ipCliente } from '@/lib/ip'

export async function enviarPedido(entrada: unknown): Promise<ResultadoPedido> {
  try {
    const r = await crearPedido(entrada, { ip: ipCliente(await headers()) })
    if (r.ok) revalidatePath('/admin', 'layout')
    return r
  } catch (e) {
    console.error('[pedido]', e)
    return { ok: false, error: 'No pudimos registrar tu pedido. Intenta de nuevo o escríbenos por WhatsApp.' }
  }
}
