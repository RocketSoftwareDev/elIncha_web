'use client'

import type { ProductoVista } from '@/lib/domain/types'
import { Configurador } from '../Configurador'
import { Galeria } from '../Galeria'
import { DorsalProvider } from './DorsalContexto'

type PropsConfigurador = React.ComponentProps<typeof Configurador>

/** Galería + formulario compartiendo el dorsal que escribe el cliente. */
export function FichaProducto({ producto, combo, drop, inmediata = false, guiaTallas = null }: {
  producto: ProductoVista; combo: PropsConfigurador['combo']; drop: PropsConfigurador['drop']; inmediata?: boolean; guiaTallas?: string | null
}) {
  // Abre en «entrega inmediata» si se llegó desde ese apartado o si no hay drop y hay sobrantes.
  const abreInmediata = producto.stock.length > 0 && (inmediata || !drop)
  return (
    <DorsalProvider personalizable={producto.tipo.aceptaPersonalizacion && !abreInmediata}>
      <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">
        <Galeria
          fotos={producto.fotos}
          alt={`${producto.equipo.nombre} ${producto.nombre}`}
          personalizable={producto.tipo.aceptaPersonalizacion}
          esShort={producto.tipo.esShort}
        />
        <Configurador producto={producto} combo={combo} drop={drop} inicioInmediata={abreInmediata} guiaTallas={guiaTallas} />
      </div>
    </DorsalProvider>
  )
}
