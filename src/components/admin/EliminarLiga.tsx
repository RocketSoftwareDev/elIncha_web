'use client'

import { Trash2 } from 'lucide-react'
import { useActionState, useState } from 'react'
import { eliminarLigaAccion } from '@/app/admin/acciones'
import { Aviso } from './ui'

interface Props {
  id: string
  nombre: string
  equipos: number
  camisetas: number
}

/** Zona de peligro: borrar es irreversible, así que se pide escribir el nombre de la liga. */
export function EliminarLiga({ id, nombre, equipos, camisetas }: Props) {
  const [estado, enviar, pendiente] = useActionState(eliminarLigaAccion, null)
  const [texto, setTexto] = useState('')
  const coincide = texto.trim().toLowerCase() === nombre.toLowerCase()

  return (
    <details className="group rounded-xl border border-red-200 bg-red-50/40">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-red-700 [&::-webkit-details-marker]:hidden">
        <Trash2 size={15} aria-hidden /> Eliminar liga
      </summary>
      <form action={enviar} className="space-y-3 border-t border-red-200 px-4 py-4">
        <input type="hidden" name="id" value={id} />
        <p className="text-sm text-navy-950">
          Se borrarán <b>{nombre}</b>, sus <b>{equipos} {equipos === 1 ? 'equipo' : 'equipos'}</b> y sus{' '}
          <b>{camisetas} {camisetas === 1 ? 'camiseta' : 'camisetas'}</b>, con todas sus imágenes. <b>No se puede deshacer.</b>
        </p>
        <p className="text-xs text-ink-soft">
          Los pedidos anteriores no se afectan. Si solo quieres sacarla de la tienda, mejor ocúltala.
        </p>
        <label className="block space-y-1.5">
          <span className="text-xs text-ink-soft">Para confirmar, escribe <b className="text-navy-950">{nombre}</b></span>
          <input
            name="confirmacion"
            value={texto}
            onChange={e => setTexto(e.target.value)}
            autoComplete="off"
            className="w-full rounded-lg border border-red-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500"
          />
        </label>
        {estado?.error && <Aviso tipo="error">{estado.error}</Aviso>}
        <button type="submit" disabled={!coincide || pendiente}
          className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-40">
          <Trash2 size={14} aria-hidden /> {pendiente ? 'Eliminando…' : 'Eliminar definitivamente'}
        </button>
      </form>
    </details>
  )
}
