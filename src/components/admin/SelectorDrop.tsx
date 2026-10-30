'use client'

import { Timer } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export function SelectorDrop({ drops, actual, conInmediata = false }: { drops: { id: string; nombre: string }[]; actual: string; conInmediata?: boolean }) {
  const router = useRouter()
  const ruta = usePathname()
  const params = useSearchParams()

  return (
    <label className="inline-flex items-center gap-2 rounded-lg border border-navy-950/15 bg-white px-3 py-2 text-sm font-semibold text-navy-950">
      <Timer size={15} aria-hidden />
      <span className="sr-only">Drop</span>
      <select
        value={actual}
        onChange={e => {
          const p = new URLSearchParams(params)
          p.set('drop', e.target.value)
          p.delete('codigo')
          router.push(`${ruta}?${p}`)
        }}
        className="bg-transparent outline-none"
      >
        {drops.map(d => (
          <option key={d.id} value={d.id}>{d.nombre}</option>
        ))}
        {/* Pedidos solo de stock: no pertenecen a ningún drop. */}
        {conInmediata && <option value="inmediata">Entrega inmediata (sin drop)</option>}
      </select>
    </label>
  )
}
