'use client'

import { Eye, Plus } from 'lucide-react'
import { useState } from 'react'
import { guardarSeccionAccion } from '@/app/admin/acciones'
import { BloquesSoporte } from '@/components/BloquesSoporte'
import { MAX_CONTENIDO, MAX_TITULO } from '@/lib/domain/soporte'
import type { SeccionSoporte } from '@/lib/domain/types'
import { BotonEnviar, FormAccion } from './FormAccion'
import { Campo, boton, input } from './ui'

/** Alta o edición de una sección de /soporte, con vista previa de cómo se verá. */
export function FormSeccion({ seccion }: { seccion?: SeccionSoporte }) {
  const [texto, setTexto] = useState(seccion?.contenido ?? '')
  const [previa, setPrevia] = useState(false)

  return (
    <FormAccion accion={guardarSeccionAccion} className="space-y-3" onReset={() => !seccion && setTexto('')}>
      <input type="hidden" name="id" value={seccion?.id ?? ''} />
      <Campo label="Título">
        <input name="titulo" defaultValue={seccion?.titulo} placeholder="Ej. Preguntas frecuentes" required maxLength={MAX_TITULO} className={input} />
      </Campo>
      <Campo label={`Texto · ${texto.length}/${MAX_CONTENIDO}`}>
        <textarea name="contenido" value={texto} onChange={e => setTexto(e.target.value)} rows={8} maxLength={MAX_CONTENIDO}
          placeholder={'Escribe aquí. Ejemplo:\n\nLavar a mano o en ciclo suave:\n- Al revés, con agua fría\n- No usar secadora\n\nTalla | Pecho (cm) | Largo (cm)\nS | 50 | 70'}
          className={`${input} font-mono text-[13px] leading-relaxed`} />
      </Campo>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-navy-950">
          <input type="checkbox" name="visible" defaultChecked={seccion?.visible ?? false} className="size-4 accent-navy-950" /> Mostrar en la tienda
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPrevia(v => !v)} disabled={!texto.trim()} className={`${boton.claro} py-2`}>
            <Eye size={14} aria-hidden /> {previa ? 'Ocultar vista previa' : 'Vista previa'}
          </button>
          <BotonEnviar className={`${boton.oscuro} py-2`}>{seccion ? 'Guardar' : <><Plus size={14} className="text-sky" aria-hidden /> Agregar sección</>}</BotonEnviar>
        </div>
      </div>
      {previa && texto.trim() && (
        <div className="rounded-xl bg-navy-950 p-5 text-white">
          <p className="display mb-3 text-2xl">{seccion?.titulo ?? 'Vista previa'}</p>
          <BloquesSoporte contenido={texto} />
        </div>
      )}
    </FormAccion>
  )
}
