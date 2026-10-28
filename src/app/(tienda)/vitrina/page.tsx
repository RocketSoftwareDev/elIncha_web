import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { TarjetaProducto } from '@/components/tienda/TarjetaProducto'
import { Buscador, FiltrosMovil, SelectorOrden } from '@/components/vitrina/Controles'
import { Filtros } from '@/components/vitrina/Filtros'
import { aceptaPedidos, fechaCorta } from '@/lib/domain/drop'
import { alternar, buscar, idCorto, leerFiltros, urlVitrina } from '@/lib/domain/vitrina'
import { catalogoVisible, dropActual, equiposVisibles, ligasVisibles, tipos } from '@/lib/data/tienda'
import { RegistrarBusquedaVacia } from '@/lib/analitica/Registro'
import { ahora } from '@/lib/reloj'

export const metadata: Metadata = {
  title: 'La vitrina',
  description: 'Todas las camisetas de El Hincha: clubes, selecciones, retro y musculeras. Nombre y número gratis.',
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function Vitrina({ searchParams }: Props) {
  const filtros = leerFiltros(await searchParams)
  const [catalogo, ligas, listaTipos, equipos, drop] = await Promise.all([catalogoVisible(), ligasVisibles(), tipos(), equiposVisibles(), dropActual()])
  const r = buscar(catalogo, filtros)
  const abierto = aceptaPedidos(drop, ahora())

  const chips = [
    ...filtros.ligas.map(s => ({ etiqueta: ligas.find(l => l.slug === s)?.nombre ?? s, href: urlVitrina(filtros, { ligas: alternar(filtros.ligas, s) }) })),
    ...filtros.tipos.map(t => ({ etiqueta: listaTipos.find(x => idCorto(x.id) === t)?.nombre ?? t, href: urlVitrina(filtros, { tipos: alternar(filtros.tipos, t) }) })),
    ...filtros.equipos.map(e => ({ etiqueta: equipos.find(x => idCorto(x.id) === e)?.nombre ?? e, href: urlVitrina(filtros, { equipos: alternar(filtros.equipos, e) }) })),
    ...(filtros.parches ? [{ etiqueta: 'Con parches', href: urlVitrina(filtros, { parches: false }) }] : []),
  ]
  // La búsqueda no va como etiqueta: se borra desde el mismo campo (botón ×).
  const panel = (
    <Filtros filtros={filtros} ligas={ligas} tipos={listaTipos} equipos={equipos} porLiga={r.porLiga} porTipo={r.porTipo} porEquipo={r.porEquipo} />
  )

  return (
    <>
      <RegistrarBusquedaVacia termino={filtros.q} total={r.total} />
      <div className="border-b border-line px-4 pb-8 pt-8 md:px-[72px] md:pt-10">
        <div className="mx-auto max-w-[1296px] space-y-6">
          <p className="kicker text-muted"><Link href="/" className="hover:text-white">Inicio</Link> / La vitrina</p>
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="space-y-2">
              <h1 className="display text-[clamp(56px,7vw,88px)] leading-[0.95]">La vitrina</h1>
              <p className="text-muted">
                {catalogo.length} camisetas en {ligas.length} ligas
                {abierto ? ` · ${drop!.nombre} cierra el ${fechaCorta(drop!.cierraEn)}` : ' · ahora mismo no hay drop abierto'}
              </p>
            </div>
            <Buscador filtros={filtros} />
          </div>
        </div>
      </div>

      <div className="px-4 pb-24 pt-8 md:px-[72px]">
        <div className="mx-auto flex max-w-[1296px] gap-12">
          <aside className="hidden w-[280px] shrink-0 lg:block" aria-label="Filtros">{panel}</aside>

          <section className="min-w-0 flex-1 space-y-6" aria-label="Resultados">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <FiltrosMovil activos={chips.length} total={r.total}>{panel}</FiltrosMovil>
                {chips.map(c => (
                  <Link key={c.href + c.etiqueta} href={c.href} scroll={false} className="flex items-center gap-1.5 bg-sky py-[7px] pl-3 pr-2.5 text-[13px] font-semibold text-navy-950" aria-label={`Quitar filtro ${c.etiqueta}`}>
                    {c.etiqueta} <X size={14} aria-hidden />
                  </Link>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <p className="kicker text-[11px] text-muted" aria-live="polite">{r.total} {r.total === 1 ? 'resultado' : 'resultados'}</p>
                <SelectorOrden filtros={filtros} />
              </div>
            </div>

            {r.total === 0 ? (
              <div className="space-y-4 border border-line px-6 py-16 text-center">
                <p className="display text-4xl">No encontramos esa camiseta</p>
                <p className="text-muted">Prueba con otro equipo o quita algún filtro. ¿No está la tuya? Escríbenos y la buscamos para el próximo drop.</p>
                <Link href="/vitrina" className="kicker inline-block border border-white px-6 py-3.5 font-bold">Ver toda la vitrina</Link>
              </div>
            ) : (
              <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:gap-x-6 xl:grid-cols-3">
                {r.productos.map(p => <TarjetaProducto key={p.id} producto={p} />)}
              </ul>
            )}

            {r.paginas > 1 && (
              <nav aria-label="Páginas" className="flex justify-center gap-2 pt-6">
                {r.pagina > 1 && <Link href={urlVitrina(filtros, { pagina: r.pagina - 1 })} aria-label="Página anterior" className="grid size-11 place-items-center border border-line"><ArrowLeft size={16} /></Link>}
                {Array.from({ length: r.paginas }, (_, i) => i + 1).map(n => (
                  <Link key={n} href={urlVitrina(filtros, { pagina: n })} aria-current={n === r.pagina ? 'page' : undefined} className={`grid size-11 place-items-center border text-sm font-bold ${n === r.pagina ? 'border-white bg-white text-navy-950' : 'border-line'}`}>{n}</Link>
                ))}
                {r.pagina < r.paginas && <Link href={urlVitrina(filtros, { pagina: r.pagina + 1 })} aria-label="Página siguiente" className="grid size-11 place-items-center border border-line"><ArrowRight size={16} /></Link>}
              </nav>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
