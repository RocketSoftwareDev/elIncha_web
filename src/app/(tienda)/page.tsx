import { ComoComprar } from '@/components/tienda/ComoComprar'
import { DropSeccion } from '@/components/tienda/DropSeccion'
import { LigasGancho } from '@/components/tienda/LigasGancho'
import { Portada, Ticker } from '@/components/tienda/Portada'
import { Somos } from '@/components/tienda/Somos'
import { aceptaPedidos } from '@/lib/domain/drop'
import { ajustesPublicos, catalogoVisible, combosActivos, dropActual, ligasVisibles, tipos } from '@/lib/data/tienda'
import { ahora as horaServidor } from '@/lib/reloj'

export default async function Inicio() {
  const [ligas, productos, drop, ajustes, listaTipos, combos] = await Promise.all([
    ligasVisibles(), catalogoVisible(), dropActual(), ajustesPublicos(), tipos(), combosActivos(),
  ])
  const conteo = new Map<string, number>()
  for (const p of productos) conteo.set(p.liga.slug, (conteo.get(p.liga.slug) ?? 0) + 1)
  const ahora = horaServidor()

  return (
    <>
      {/* Las ligas abren la página como gancho; las camisetas viven en /vitrina. */}
      <LigasGancho ligas={ligas} conteo={conteo} total={productos.length} />
      <Portada whatsapp={ajustes.whatsapp} />
      <Ticker />
      <Somos />
      <DropSeccion drop={drop} abierto={aceptaPedidos(drop, ahora)} ahora={ahora} whatsapp={ajustes.whatsapp} />
      <ComoComprar ajustes={ajustes} tipos={listaTipos} combos={combos} />
    </>
  )
}
