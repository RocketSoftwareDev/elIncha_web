'use client'

import { Plus, Trash2 } from 'lucide-react'
import { crearTipoAccion, editarTipoAccion, eliminarTipoAccion } from '@/app/admin/acciones'
import type { TipoPrenda } from '@/lib/domain/types'
import { BotonEnviar, FormAccion } from './FormAccion'
import { Campo, boton, input } from './ui'

export const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Niño']

/** Casillas de tallas con aspecto de botón (sirve para tipos y pantalonetas). */
export function SelectorTallas({ marcadas }: { marcadas: string[] }) {
  return (
    <fieldset className="flex flex-wrap gap-1.5">
      <legend className="kicker mb-1.5 text-[10px] text-ink-soft">Tallas</legend>
      {TALLAS.map(t => (
        <label key={t} className="cursor-pointer">
          <input type="checkbox" name="tallas" value={t} defaultChecked={marcadas.includes(t)} className="peer sr-only" />
          <span className="inline-block rounded-lg border border-navy-950/15 bg-white px-3 py-1.5 text-[13px] font-semibold text-navy-950 peer-checked:border-navy-950 peer-checked:bg-navy-950 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-sky">
            {t}
          </span>
        </label>
      ))}
    </fieldset>
  )
}

function Casilla({ name, defaultChecked, label }: { name: string; defaultChecked: boolean; label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-navy-950">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-4 accent-navy-950" /> {label}
    </label>
  )
}

/** Alta o edición de un tipo de prenda. Sin `tipo` es «nuevo». */
export function FormTipo({ tipo }: { tipo?: TipoPrenda }) {
  return (
    <FormAccion accion={tipo ? editarTipoAccion : crearTipoAccion} className="space-y-3.5 bg-[#f3f8fe] p-4">
      {tipo && <input type="hidden" name="id" value={tipo.id} />}
      <div className="grid gap-3 sm:grid-cols-[1fr_130px]">
        <Campo label="Nombre">
          <input name="nombre" defaultValue={tipo?.nombre} placeholder="Ej. Camiseta Fan" required maxLength={40} className={input} />
        </Campo>
        <Campo label="Precio ($)">
          <input name="precio" defaultValue={tipo?.precio.toFixed(2)} placeholder="30.00" inputMode="decimal" pattern="\d{1,4}([.,]\d{1,2})?" required className={input} />
        </Campo>
      </div>
      <SelectorTallas marcadas={tipo?.tallas ?? ['S', 'M', 'L', 'XL']} />
      <div className="flex flex-wrap gap-5">
        <Casilla name="aceptaPersonalizacion" defaultChecked={tipo?.aceptaPersonalizacion ?? true} label="Acepta nombre y número" />
        <Casilla name="esShort" defaultChecked={tipo?.esShort ?? false} label="Es pantaloneta (short)" />
      </div>
      <BotonEnviar className={boton.oscuro}>{tipo ? 'Guardar tipo' : <><Plus size={14} className="text-sky" aria-hidden /> Agregar tipo</>}</BotonEnviar>
    </FormAccion>
  )
}

export function QuitarTipo({ id, nombre }: { id: string; nombre: string }) {
  return (
    <FormAccion accion={eliminarTipoAccion} className="flex flex-col items-end gap-1">
      <input type="hidden" name="id" value={id} />
      <button type="submit" aria-label={`Quitar ${nombre}`} onClick={e => { if (!confirm(`¿Quitar el tipo «${nombre}»?`)) e.preventDefault() }}
        className="grid size-8 place-items-center rounded-lg border border-line-dark text-red-700 hover:bg-red-50">
        <Trash2 size={14} />
      </button>
    </FormAccion>
  )
}
