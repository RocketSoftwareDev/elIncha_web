'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import { agregarStockAccion } from '@/app/admin/acciones'
import { BotonEnviar, FormAccion } from './FormAccion'
import { Campo, boton, input } from './ui'

export interface OpcionCamiseta { id: string; nombre: string; grupo: string; tallas: string[]; precio: number }

/** Alta de sobrantes: la talla depende de la camiseta elegida. */
export function FormStock({ camisetas }: { camisetas: OpcionCamiseta[] }) {
  const [id, setId] = useState('')
  const elegida = camisetas.find(c => c.id === id)
  const grupos = [...new Set(camisetas.map(c => c.grupo))]

  return (
    <FormAccion accion={agregarStockAccion} className="space-y-4 p-5" onReset={() => setId('')}>
      <Campo label="Camiseta">
        <select name="productoId" required defaultValue="" onChange={e => setId(e.target.value)} className={input}>
          <option value="">Elige…</option>
          {grupos.map(g => (
            <optgroup key={g} label={g}>
              {camisetas.filter(c => c.grupo === g).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </optgroup>
          ))}
        </select>
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Talla">
          <select key={id} name="talla" required disabled={!elegida} className={input}>
            <option value="">—</option>
            {elegida?.tallas.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Campo>
        <Campo label="Unidades">
          <input name="cantidad" type="number" min={1} max={500} defaultValue={1} required className={input} />
        </Campo>
      </div>
      <Campo label="Precio (opcional)">
        <input name="precio" type="number" min={1} max={500} step="0.01" placeholder={elegida ? `Normal: $${elegida.precio}` : 'Vacío = precio normal'} className={input} />
      </Campo>
      <p className="text-xs text-ink-soft">Si esa talla ya está en la lista, se suman las unidades. Ponle precio solo si quieres rebajarla.</p>
      <BotonEnviar className={`${boton.oscuro} w-full`}><Plus size={16} className="text-sky" aria-hidden /> Agregar al stock</BotonEnviar>
    </FormAccion>
  )
}
