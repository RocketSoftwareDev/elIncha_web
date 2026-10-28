'use client'

import { ShoppingBag } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { articulosCarrito, useCarrito } from '@/lib/cart/store'

const sinSuscripcion = () => () => {}

export function BotonCarrito() {
  const lineas = useCarrito(s => s.lineas)
  const abrir = useCarrito(s => s.abrir)
  // El carrito vive en localStorage: en el servidor siempre se pinta en 0.
  const montado = useSyncExternalStore(sinSuscripcion, () => true, () => false)
  const n = montado ? articulosCarrito(lineas) : 0

  return (
    <button
      type="button"
      onClick={abrir}
      aria-label={`Abrir carrito, ${n} ${n === 1 ? 'prenda' : 'prendas'}`}
      className="flex items-center gap-2 rounded-full border border-line px-4 py-2.5 transition hover:border-sky"
    >
      <ShoppingBag size={18} aria-hidden />
      <span className="grid size-[22px] place-items-center rounded-full bg-sky text-xs font-bold text-navy-950">{n}</span>
    </button>
  )
}
