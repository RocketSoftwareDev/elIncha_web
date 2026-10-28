import type { EstadoDrop, EstadoPedido } from '@/lib/domain/types'

export const ESTADO_PEDIDO: Record<EstadoPedido, { label: string; clase: string }> = {
  por_confirmar: { label: 'Por confirmar', clase: 'bg-amber-100 text-amber-800' },
  reserva_pagada: { label: 'Reserva pagada', clase: 'bg-sky-100 text-sky-800' },
  pagado: { label: 'Pagado completo', clase: 'bg-green-100 text-green-800' },
  entregado: { label: 'Entregado', clase: 'bg-indigo-100 text-indigo-800' },
  cancelado: { label: 'Cancelado', clase: 'bg-slate-100 text-slate-600' },
}

export const ESTADO_DROP: Record<EstadoDrop, { label: string; clase: string }> = {
  borrador: { label: 'Borrador', clase: 'bg-indigo-50 text-indigo-800' },
  abierto: { label: 'Abierto', clase: 'bg-green-100 text-green-800' },
  cerrado: { label: 'Cerrado', clase: 'bg-slate-100 text-slate-600' },
  en_camino: { label: 'En camino', clase: 'bg-amber-100 text-amber-800' },
  entregado: { label: 'Entregado', clase: 'bg-slate-100 text-slate-600' },
}

export const ESTADOS_PEDIDO = Object.keys(ESTADO_PEDIDO) as EstadoPedido[]
