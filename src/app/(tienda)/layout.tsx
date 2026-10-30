import { CarritoPanel } from '@/components/tienda/CarritoPanel'
import { Footer } from '@/components/tienda/Footer'
import { Header } from '@/components/tienda/Header'
import { aceptaPedidos, resumenDrop } from '@/lib/domain/drop'
import { ajustesPublicos, dropActual } from '@/lib/data/tienda'
import { RegistroVistas } from '@/lib/analitica/Registro'
import { ahora } from '@/lib/reloj'

// Cada visita lee el catálogo y el drop vigentes: nada se congela al compilar.
export const dynamic = 'force-dynamic'

export default async function TiendaLayout({ children }: { children: React.ReactNode }) {
  const [drop, ajustes] = await Promise.all([dropActual(), ajustesPublicos()])
  const abierto = aceptaPedidos(drop, ahora())

  return (
    <>
      <RegistroVistas />
      <Header whatsapp={ajustes.whatsapp} />
      <main>{children}</main>
      <Footer ajustes={ajustes} />
      <CarritoPanel
        dropNombre={abierto ? drop!.nombre : null}
        llegaEntre={abierto ? resumenDrop(drop!).llegaEntre : null}
        montoReserva={ajustes.montoReserva}
        instagram={ajustes.redes.instagram}
      />
    </>
  )
}
