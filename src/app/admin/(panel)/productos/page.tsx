import { requerirAdmin } from '@/lib/auth/sesion'
import type { Metadata } from 'next'
import { ExternalLink, Pencil, Plus, Search } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { alternarVisibleAccion } from '@/app/admin/acciones'
import { Card, PageHeader, boton } from '@/components/admin/ui'
import { listarDrops, listarLigas, listarPedidos, listarProductos } from '@/lib/data/admin'
import { formatoPrecio } from '@/lib/domain/pricing'

export const metadata: Metadata = { title: 'Productos' }

type Params = Promise<{ q?: string; liga?: string }>

const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default async function ProductosPage({ searchParams }: { searchParams: Params }) {
  // El layout no basta: Next genera la página en paralelo. Se verifica aquí también.
  await requerirAdmin()
  const { q = '', liga } = await searchParams
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
    (!q || sinTildes(`${p.equipo.nombre} ${p.nombre} ${p.tipo.nombre}`).includes(sinTildes(q))),
  )

  const kpis = [
    ['Camisetas en vitrina', String(visibles.length), `en ${new Set(visibles.map(p => p.liga.id)).size} ligas · ${new Set(visibles.map(p => p.equipo.id)).size} equipos`],
    [`Pedidos ${abierto?.nombre ?? ''}`, String(pedidos.length), abierto?.estado === 'abierto' ? 'drop abierto' : 'sin drop abierto'],
    ['Ocultas', String(productos.length - visibles.length), 'no se muestran en la web'],
    ['La más pedida', masPedida ? masPedida.equipo.nombre : '—', masPedida ? `${masPedida.nombre} · ${masPedidaN} pedidos` : 'aún sin pedidos'],
  ]

  const enlace = (l?: string) => `/admin/productos?${new URLSearchParams({ ...(q && { q }), ...(l && { liga: l }) })}`

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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-dark px-5 py-4">
          <form className="flex w-full max-w-xs items-center gap-2 rounded-lg bg-admin-bg px-3 py-2.5" role="search">
            <Search size={16} className="text-ink-soft" aria-hidden />
            {liga && <input type="hidden" name="liga" value={liga} />}
            <input name="q" defaultValue={q} placeholder="Buscar camiseta, equipo…" aria-label="Buscar" className="w-full bg-transparent text-sm outline-none" />
          </form>
          <nav aria-label="Filtrar por liga" className="flex flex-wrap gap-1.5">
            {[undefined, ...ligas].map(l => {
              const activo = (l?.id ?? undefined) === liga
              return (
                <Link key={l?.id ?? 'todas'} href={enlace(l?.id)} aria-current={activo ? 'page' : undefined}
                  className={`rounded-full px-3 py-1.5 text-[13px] font-semibold ${activo ? 'bg-navy-950 text-white' : 'bg-admin-bg text-navy-800'}`}>
                  {l?.nombre ?? 'Todas'}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="overflow-x-auto">
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
              {filtrados.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-ink-soft">No hay camisetas con este filtro.</td></tr>
              )}
              {filtrados.map((p, i) => (
                <tr key={p.id} className="border-b border-line-dark last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-[52px] w-11 shrink-0 overflow-hidden rounded-md bg-[#e3ecf8]">
                        {p.fotos[0] && <Image src={p.fotos[0]} alt="" fill sizes="44px" className="object-cover" />}
                      </div>
                      <div>
                        <p className="font-semibold">{p.equipo.nombre} {p.nombre}</p>
                        <p className="font-mono text-[10px] text-[#8a97b8]">SKU EH-{1000 + i * 37}</p>
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
      </Card>
    </>
  )
}
