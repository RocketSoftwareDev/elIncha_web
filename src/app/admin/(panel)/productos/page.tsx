import { requerirAdmin } from '@/lib/auth/sesion'
import type { Metadata } from 'next'
import { ChevronLeft, ChevronRight, ExternalLink, Pencil, Plus, Search, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { alternarVisibleAccion } from '@/app/admin/acciones'
import { Card, PageHeader, boton } from '@/components/admin/ui'
import { listarDrops, listarLigas, listarPedidos, listarProductos } from '@/lib/data/admin'
import { formatoPrecio } from '@/lib/domain/pricing'

export const metadata: Metadata = { title: 'Productos' }

type Params = Promise<{ q?: string; liga?: string; estado?: string; pagina?: string; porPagina?: string }>

const TAMANOS_PAGINA = [10, 25, 50] as const

const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default async function ProductosPage({ searchParams }: { searchParams: Params }) {
  // El layout no basta: Next genera la página en paralelo. Se verifica aquí también.
  await requerirAdmin()
  const { q = '', liga, estado, pagina: paginaParam, porPagina: porPaginaParam } = await searchParams
  const [productos, ligas, drops] = await Promise.all([listarProductos(), listarLigas(), listarDrops()])
  const abierto = drops.find(d => d.estado === 'abierto') ?? drops[0]
  const pedidos = abierto ? await listarPedidos({ dropId: abierto.id }) : []

  const visibles = productos.filter(p => p.visible)
  const conteo = new Map<string, number>()
  for (const p of pedidos) for (const i of p.items) if (i.productoId) conteo.set(i.productoId, (conteo.get(i.productoId) ?? 0) + i.cantidad)
  const [masPedidaId, masPedidaN] = [...conteo.entries()].sort((a, b) => b[1] - a[1])[0] ?? []
  const masPedida = productos.find(p => p.id === masPedidaId)

  const filtrados = productos.filter(p =>
    (!liga || p.liga.id === liga) &&
    (estado !== 'visibles' || p.visible) &&
    (estado !== 'ocultas' || !p.visible) &&
    (!q || sinTildes(`${p.equipo.nombre} ${p.nombre} ${p.tipo.nombre}`).includes(sinTildes(q))),
  )

  const porPaginaSolicitado = Number(porPaginaParam)
  const porPagina = TAMANOS_PAGINA.find(n => n === porPaginaSolicitado) ?? TAMANOS_PAGINA[0]
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina))
  const paginaSolicitada = Number.parseInt(paginaParam ?? '1', 10)
  const pagina = Math.min(Math.max(Number.isFinite(paginaSolicitada) ? paginaSolicitada : 1, 1), totalPaginas)
  const inicio = (pagina - 1) * porPagina
  const productosPagina = filtrados.slice(inicio, inicio + porPagina)
  const indicePorId = new Map(productos.map((p, i) => [p.id, i]))

  const kpis = [
    ['Camisetas en vitrina', String(visibles.length), `en ${new Set(visibles.map(p => p.liga.id)).size} ligas · ${new Set(visibles.map(p => p.equipo.id)).size} equipos`],
    [`Pedidos ${abierto?.nombre ?? ''}`, String(pedidos.length), abierto?.estado === 'abierto' ? 'drop abierto' : 'sin drop abierto'],
    ['Ocultas', String(productos.length - visibles.length), 'no se muestran en la web'],
    ['La más pedida', masPedida ? masPedida.equipo.nombre : '—', masPedida ? `${masPedida.nombre} · ${masPedidaN} pedidos` : 'aún sin pedidos'],
  ]

  const url = (cambios: Record<string, string | undefined> = {}) => {
    const params = new URLSearchParams()
    const valores = { q: q || undefined, liga, estado, porPagina: String(porPagina), pagina: String(pagina), ...cambios }
    for (const [clave, valor] of Object.entries(valores)) if (valor) params.set(clave, valor)
    return `/admin/productos?${params}`
  }

  const paginasVisibles = [...new Set([1, pagina - 1, pagina, pagina + 1, totalPaginas])].filter(n => n >= 1 && n <= totalPaginas).sort((a, b) => a - b)

  return (
    <>
      <PageHeader titulo="Productos" subtitulo="Cada camiseta se asigna a una liga, un equipo y un tipo de prenda. El precio sale del tipo.">
        <Link href="/" target="_blank" className={boton.claro}><ExternalLink size={16} aria-hidden /> Ver tienda</Link>
        <Link href="/admin/productos/nueva" className={boton.oscuro}><Plus size={16} className="text-sky" aria-hidden /> Nueva camiseta</Link>
      </PageHeader>

      <dl className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpis.map(([k, v, s]) => (
          <Card key={k} className="space-y-1.5 p-5">
            <dt className="kicker text-[10px] text-ink-soft">{k}</dt>
            <dd className="display truncate text-[40px]">{v}</dd>
            <dd className="text-xs text-ink-soft">{s}</dd>
          </Card>
        ))}
      </dl>

      <Card className="overflow-hidden">
        <div className="space-y-3 border-b border-line-dark px-4 py-4 sm:px-5">
          <form className="flex w-full items-center gap-2 sm:max-w-xl" role="search">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-admin-bg px-3 py-2.5 focus-within:ring-2 focus-within:ring-sky">
              <Search size={16} className="shrink-0 text-ink-soft" aria-hidden />
              {liga && <input type="hidden" name="liga" value={liga} />}
              {estado && <input type="hidden" name="estado" value={estado} />}
              <input type="hidden" name="porPagina" value={porPagina} />
              <input name="q" defaultValue={q} placeholder="Buscar camiseta, equipo o tipo…" aria-label="Buscar productos" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            </label>
            <button type="submit" className="rounded-lg bg-navy-950 px-3.5 py-2.5 text-sm font-semibold text-white">Buscar</button>
            {(q || liga || estado) && (
              <Link href={url({ q: undefined, liga: undefined, estado: undefined, pagina: undefined })} aria-label="Limpiar búsqueda y filtros"
                className="grid size-10 shrink-0 place-items-center rounded-lg border border-line-dark text-ink-soft hover:bg-admin-bg hover:text-navy-950">
                <X size={16} aria-hidden />
              </Link>
            )}
          </form>

          <div className="space-y-2">
            <p className="kicker text-[9px] text-ink-soft">Liga</p>
            <nav aria-label="Filtrar por liga" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
              {[undefined, ...ligas].map(l => {
                const activo = (l?.id ?? undefined) === liga
                return (
                  <Link key={l?.id ?? 'todas'} href={url({ liga: l?.id, pagina: undefined })} aria-current={activo ? 'page' : undefined}
                    className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-semibold ${activo ? 'bg-navy-950 text-white' : 'bg-admin-bg text-navy-800'}`}>
                    {l?.nombre ?? 'Todas'}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="space-y-2">
            <p className="kicker text-[9px] text-ink-soft">Visibilidad</p>
            <nav aria-label="Filtrar por visibilidad" className="flex flex-wrap gap-1.5">
              {[
                [undefined, 'Todos'],
                ['visibles', 'En vitrina'],
                ['ocultas', 'Ocultos'],
              ].map(([valor, etiqueta]) => {
                const activo = valor === estado || (!valor && !estado)
                return (
                  <Link key={etiqueta} href={url({ estado: valor, pagina: undefined })} aria-current={activo ? 'page' : undefined}
                    className={`rounded-full border px-3 py-1.5 text-[13px] font-semibold ${activo ? 'border-navy-950 bg-navy-950 text-white' : 'border-line-dark bg-white text-navy-800'}`}>
                    {etiqueta}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-[#f8fafd] text-left">
              <tr className="kicker text-[10px] text-ink-soft">
                <th className="px-5 py-2.5 font-normal">Camiseta</th>
                <th className="px-3 py-2.5 font-normal">Liga</th>
                <th className="px-3 py-2.5 font-normal">Precio</th>
                <th className="px-3 py-2.5 font-normal">Tipo de prenda</th>
                <th className="px-3 py-2.5 font-normal">Parches</th>
                <th className="px-3 py-2.5 font-normal">Visible</th>
                <th className="px-5 py-2.5"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {productosPagina.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-ink-soft">No hay camisetas con este filtro.</td></tr>
              )}
              {productosPagina.map(p => (
                <tr key={p.id} className="border-b border-line-dark last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-[52px] w-11 shrink-0 overflow-hidden rounded-md bg-[#e3ecf8]">
                        {p.fotos[0] && <Image src={p.fotos[0]} alt="" fill sizes="44px" className="object-cover" />}
                      </div>
                      <div>
                        <p className="font-semibold">{p.equipo.nombre} {p.nombre}</p>
                        <p className="font-mono text-[10px] text-[#8a97b8]">SKU EH-{1000 + (indicePorId.get(p.id) ?? 0) * 37}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3"><span className="rounded-md bg-sky-soft px-2 py-1 text-xs font-semibold text-navy-800">{p.liga.nombre}</span></td>
                  <td className="display px-3 py-3 text-xl">{formatoPrecio(p.precioEspecial ?? p.tipo.precio)}</td>
                  <td className="px-3 py-3 text-[13px] text-navy-800">{p.tipo.nombre}</td>
                  <td className="px-3 py-3 text-xs text-navy-800">{p.parches.length ? p.parches.map(x => x.nombre).join(', ') : <span className="text-[#8a97b8]">—</span>}</td>
                  <td className="px-3 py-3">
                    <form action={alternarVisibleAccion}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" role="switch" aria-checked={p.visible} aria-label={`Visible en la vitrina: ${p.equipo.nombre} ${p.nombre}`}
                        className={`flex h-[22px] w-10 rounded-full p-[3px] transition ${p.visible ? 'justify-end bg-navy-950' : 'justify-start bg-slate-300'}`}>
                        <span className={`h-4 w-4 rounded-full ${p.visible ? 'bg-sky' : 'bg-white'}`} />
                      </button>
                    </form>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/admin/productos/${p.id}`} aria-label={`Editar ${p.equipo.nombre} ${p.nombre}`} className="inline-flex rounded-md p-1.5 text-ink-soft hover:bg-admin-bg hover:text-navy-950">
                      <Pencil size={16} aria-hidden />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-line-dark md:hidden">
          {productosPagina.length === 0 && <p className="px-5 py-10 text-center text-sm text-ink-soft">No hay camisetas con este filtro.</p>}
          {productosPagina.map(p => (
            <article key={p.id} className="space-y-3 p-4">
              <div className="flex items-start gap-3">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-[#e3ecf8]">
                  {p.fotos[0] && <Image src={p.fotos[0]} alt="" fill sizes="64px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="inline-flex max-w-full truncate rounded-md bg-sky-soft px-2 py-1 text-[10px] font-semibold text-navy-800">{p.liga.nombre}</span>
                  <h2 className="mt-1.5 text-sm font-bold leading-snug text-navy-950">{p.equipo.nombre} {p.nombre}</h2>
                  <p className="mt-1 font-mono text-[10px] text-[#8a97b8]">SKU EH-{1000 + (indicePorId.get(p.id) ?? 0) * 37}</p>
                </div>
                <Link href={`/admin/productos/${p.id}`} aria-label={`Editar ${p.equipo.nombre} ${p.nombre}`}
                  className="grid size-10 shrink-0 place-items-center rounded-lg border border-line-dark bg-white text-navy-950">
                  <Pencil size={16} aria-hidden />
                </Link>
              </div>

              <dl className="grid grid-cols-2 gap-2 rounded-lg bg-admin-bg p-3">
                <div>
                  <dt className="kicker text-[8px] text-ink-soft">Precio</dt>
                  <dd className="display mt-0.5 text-xl">{formatoPrecio(p.precioEspecial ?? p.tipo.precio)}</dd>
                </div>
                <div>
                  <dt className="kicker text-[8px] text-ink-soft">Tipo</dt>
                  <dd className="mt-1 text-xs font-semibold text-navy-800">{p.tipo.nombre}</dd>
                </div>
              </dl>

              {p.parches.length > 0 && <p className="line-clamp-1 text-[11px] text-ink-soft">Parches: {p.parches.map(x => x.nombre).join(', ')}</p>}

              <div className="flex items-center justify-between border-t border-line-dark pt-3">
                <span className="text-xs font-semibold text-navy-800">{p.visible ? 'Visible en la vitrina' : 'Oculta en la vitrina'}</span>
                <form action={alternarVisibleAccion}>
                  <input type="hidden" name="id" value={p.id} />
                  <button type="submit" role="switch" aria-checked={p.visible} aria-label={`Visible en la vitrina: ${p.equipo.nombre} ${p.nombre}`}
                    className={`flex h-7 w-12 rounded-full p-1 transition ${p.visible ? 'justify-end bg-navy-950' : 'justify-start bg-slate-300'}`}>
                    <span className={`h-5 w-5 rounded-full ${p.visible ? 'bg-sky' : 'bg-white'}`} />
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>

        <footer className="flex flex-col gap-4 border-t border-line-dark bg-[#f8fafd] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="text-sm font-semibold text-navy-950">
              {filtrados.length === 0 ? '0 productos' : `Mostrando ${inicio + 1}–${Math.min(inicio + porPagina, filtrados.length)} de ${filtrados.length}`}
            </p>
            <div className="mt-2 flex items-center gap-1.5" aria-label="Productos por página">
              <span className="mr-1 text-xs text-ink-soft">Por página:</span>
              {TAMANOS_PAGINA.map(tamano => (
                <Link key={tamano} href={url({ porPagina: String(tamano), pagina: undefined })} aria-current={tamano === porPagina ? 'page' : undefined}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-bold ${tamano === porPagina ? 'bg-navy-950 text-white' : 'border border-line-dark bg-white text-navy-800'}`}>
                  {tamano}
                </Link>
              ))}
            </div>
          </div>

          <nav aria-label="Paginación de productos" className="flex items-center gap-1.5">
            <Link href={url({ pagina: String(Math.max(1, pagina - 1)) })} aria-disabled={pagina === 1}
              className={`grid size-9 place-items-center rounded-lg border border-line-dark bg-white ${pagina === 1 ? 'pointer-events-none opacity-40' : 'hover:border-navy-950'}`}>
              <ChevronLeft size={16} aria-hidden /><span className="sr-only">Página anterior</span>
            </Link>
            {paginasVisibles.map((numero, indice) => (
              <span key={numero} className="contents">
                {indice > 0 && numero - paginasVisibles[indice - 1] > 1 && <span className="px-1 text-ink-soft">…</span>}
                <Link href={url({ pagina: String(numero) })} aria-current={numero === pagina ? 'page' : undefined}
                  className={`grid size-9 place-items-center rounded-lg text-xs font-bold ${numero === pagina ? 'bg-navy-950 text-white' : 'border border-line-dark bg-white text-navy-800 hover:border-navy-950'}`}>
                  {numero}
                </Link>
              </span>
            ))}
            <Link href={url({ pagina: String(Math.min(totalPaginas, pagina + 1)) })} aria-disabled={pagina === totalPaginas}
              className={`grid size-9 place-items-center rounded-lg border border-line-dark bg-white ${pagina === totalPaginas ? 'pointer-events-none opacity-40' : 'hover:border-navy-950'}`}>
              <ChevronRight size={16} aria-hidden /><span className="sr-only">Página siguiente</span>
            </Link>
          </nav>
        </footer>
      </Card>
    </>
  )
}
