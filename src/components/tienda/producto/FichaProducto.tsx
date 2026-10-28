'use client'

import type { ProductoVista } from '@/lib/domain/types'
import { Configurador } from '../Configurador'
import { Galeria } from '../Galeria'
import { DorsalProvider } from './DorsalContexto'

type PropsConfigurador = React.ComponentProps<typeof Configurador>

/** Galería + formulario compartiendo el dorsal que escribe el cliente. */
export function FichaProducto({ producto, combo, drop }: { producto: ProductoVista; combo: PropsConfigurador['combo']; drop: PropsConfigurador['drop'] }) {
  return (
    <DorsalProvider personalizable={producto.tipo.aceptaPersonalizacion}>
      <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">
        <Galeria
          fotos={producto.fotos}
          alt={`${producto.equipo.nombre} ${producto.nombre}`}
          personalizable={producto.tipo.aceptaPersonalizacion}
          esShort={producto.tipo.esShort}
        />
        <Configurador producto={producto} combo={combo} drop={drop} />
      </div>
    </DorsalProvider>
  )
}
