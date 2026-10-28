import { ComoComprar } from '@/components/tienda/ComoComprar'
import { DropSeccion } from '@/components/tienda/DropSeccion'
import { Portada, Ticker } from '@/components/tienda/Portada'
import { Somos } from '@/components/tienda/Somos'
import { Vitrina } from '@/components/tienda/Vitrina'
import { aceptaPedidos } from '@/lib/domain/drop'
import { ajustesPublicos, combosActivos, dropActual, ligasVisibles, tipos, vitrina } from '@/lib/data/tienda'
import { ahora as horaServidor } from '@/lib/reloj'

export default async function Inicio({ searchParams }: { searchParams: Promise<{ liga?: string }> }) {
  const { liga } = await searchParams
  const [ligas, drop, ajustes, listaTipos, combos] = await Promise.all([ligasVisibles(), dropActual(), ajustesPublicos(), tipos(), combosActivos()])
  const ligaActual = ligas.find(l => l.slug === liga) ?? null
  const productos = await vitrina(ligaActual?.slug)
  const ahora = horaServidor()

  return (
    <>
      {/* La vitrina abre la página; la portada va debajo (pedido de la cotización). */}
      <Vitrina ligas={ligas} productos={productos} ligaActual={ligaActual} />
      <Portada whatsapp={ajustes.whatsapp} />
      <Ticker />
      <Somos />
      <DropSeccion drop={drop} abierto={aceptaPedidos(drop, ahora)} ahora={ahora} whatsapp={ajustes.whatsapp} />
      <ComoComprar ajustes={ajustes} tipos={listaTipos} combos={combos} />
    </>
  )
}
