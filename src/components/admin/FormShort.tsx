'use client'

import { Plus, Trash2 } from 'lucide-react'
import { crearShortAccion, eliminarShortAccion, guardarShortAccion } from '@/app/admin/acciones'
import type { ShortCombo } from '@/lib/domain/types'
import { BotonEnviar, FormAccion } from './FormAccion'
import { SelectorTallas } from './FormTipo'
import { Campo, boton, input } from './ui'

/** Alta o edición de una pantaloneta del combo. La foto se cambia aparte (CambiarImagen). */
export function FormShort({ short }: { short?: ShortCombo }) {
  return (
    <FormAccion accion={short ? guardarShortAccion : crearShortAccion} className="space-y-3.5">
      {short && <input type="hidden" name="id" value={short.id} />}
      <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
        <Campo label="Nombre">
          <input name="nombre" defaultValue={short?.nombre} placeholder="Ej. Short Entrenamiento" required maxLength={40} className={input} />
        </Campo>
        <Campo label="Extra (+$)">
          <input name="extra" defaultValue={(short?.extra ?? 0).toFixed(2)} inputMode="decimal" pattern="\d{1,4}([.,]\d{1,2})?" className={input} />
        </Campo>
      </div>
      <SelectorTallas marcadas={short?.tallas ?? ['S', 'M', 'L', 'XL']} />
      {short && (
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-navy-950">
          <input type="checkbox" name="activo" defaultChecked={short.activo} className="size-4 accent-navy-950" /> Visible para el cliente
        </label>
      )}
      <div>
        <BotonEnviar className={boton.oscuro}>{short ? 'Guardar' : <><Plus size={14} className="text-sky" aria-hidden /> Agregar pantaloneta</>}</BotonEnviar>
      </div>
    </FormAccion>
  )
}

export function QuitarShort({ id, nombre }: { id: string; nombre: string }) {
  return (
    <FormAccion accion={eliminarShortAccion}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" onClick={e => { if (!confirm(`¿Quitar «${nombre}»? Los pedidos ya hechos no cambian.`)) e.preventDefault() }}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:underline">
        <Trash2 size={13} aria-hidden /> Quitar pantaloneta
      </button>
    </FormAccion>
  )
}
