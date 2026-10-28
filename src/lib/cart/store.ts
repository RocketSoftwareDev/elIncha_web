'use client'

// Carrito del cliente. Guarda lo necesario para mostrarlo; el precio final lo
// recalcula el servidor al crear el pedido.

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { LineaCarrito } from '@/lib/domain/pricing'

export interface LineaVista extends LineaCarrito {
  titulo: string
  detalle: string
  foto: string
  unitario: number
  dorsal: string | null
}

interface EstadoCarrito {
  lineas: LineaVista[]
  abierto: boolean
  agregar: (l: Omit<LineaVista, 'key'>) => void
  cambiarCantidad: (key: string, delta: number) => void
  quitar: (key: string) => void
  vaciar: () => void
  abrir: () => void
  cerrar: () => void
}

/** Misma prenda con la misma talla y personalización suma cantidad en vez de duplicarse. */
function clave(l: Omit<LineaVista, 'key'>) {
  const p = l.personalizacion
  return [l.productoId, l.comboId ?? '-', l.talla, p.nombre, p.numero, p.numeroShort, [...p.parches].sort().join('+')].join('|')
}

export const useCarrito = create<EstadoCarrito>()(
  persist(
    set => ({
      lineas: [],
      abierto: false,
      agregar: l =>
        set(s => {
          const key = clave(l)
          const existe = s.lineas.find(x => x.key === key)
          const lineas = existe
            ? s.lineas.map(x => (x.key === key ? { ...x, cantidad: Math.min(10, x.cantidad + l.cantidad) } : x))
            : [...s.lineas, { ...l, key }]
          return { lineas, abierto: true }
        }),
      cambiarCantidad: (key, delta) =>
        set(s => ({
          lineas: s.lineas.map(x => (x.key === key ? { ...x, cantidad: Math.max(1, Math.min(10, x.cantidad + delta)) } : x)),
        })),
      quitar: key => set(s => ({ lineas: s.lineas.filter(x => x.key !== key) })),
      vaciar: () => set({ lineas: [] }),
      abrir: () => set({ abierto: true }),
      cerrar: () => set({ abierto: false }),
    }),
    {
      name: 'elhincha-carrito',
      storage: createJSONStorage(() => localStorage),
      partialize: s => ({ lineas: s.lineas }),
    },
  ),
)

export const totalCarrito = (lineas: LineaVista[]) => lineas.reduce((s, l) => s + l.unitario * l.cantidad, 0)
export const articulosCarrito = (lineas: LineaVista[]) => lineas.reduce((s, l) => s + l.cantidad, 0)
