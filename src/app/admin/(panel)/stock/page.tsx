import { requerirAdmin } from '@/lib/auth/sesion'
import type { Metadata } from 'next'
import { ExternalLink, Minus, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { eliminarStockAccion, precioStockAccion, sumarStockAccion } from '@/app/admin/acciones'
import { BotonEnviar, FormAccion } from '@/components/admin/FormAccion'
import { FormStock } from '@/components/admin/FormStock'
import { Aviso, Card, CardHeader, Chip, PageHeader, input } from '@/components/admin/ui'
import { listarProductos, listarStock } from '@/lib/data/admin'
import { formatoPrecio } from '@/lib/domain/pricing'

export const metadata: Metadata = { title: 'Entrega inmediata' }

function Sumar({ id, delta, deshabilitado, children, etiqueta }: { id: string; delta: number; deshabilitado?: boolean; children: React.ReactNode; etiqueta: string }) {
  return (
    <form action={sumarStockAccion}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="delta" value={delta} />
      <button type="submit" disabled={deshabilitado} aria-label={etiqueta} className="grid size-8 place-items-center rounded-lg border border-line-dark hover:bg-admin-bg disabled:opacity-30">
        {children}
      </button>
    </form>
  )
}

export default async function StockPage() {
  // El layout no basta: Next genera la página en paralelo. Se verifica aquí también.
  await requerirAdmin()
  const [stock, productos] = await Promise.all([listarStock(), listarProductos()])
  const unidades = stock.reduce((s, x) => s + x.cantidad, 0)
  const valor = stock.reduce((s, x) => s + x.cantidad * (x.precio ?? x.precioNormal), 0)
  const camisetas = productos
    .map(p => ({ id: p.id, nombre: `${p.equipo.nombre} ${p.nombre} · ${p.tipo.nombre}`, grupo: p.liga.nombre, tallas: p.tipo.tallas, precio: p.precioEspecial ?? p.tipo.precio }))
    .sort((a, b) => a.grupo.localeCompare(b.grupo, 'es') || a.nombre.localeCompare(b.nombre, 'es'))

  return (
    <>
      <PageHeader titulo="Entrega inmediata" subtitulo="Sobrantes que ya tienes: se venden sin drop y sin personalizar." />

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card className="overflow-hidden">
          <CardHeader titulo="En stock" subtitulo={`${unidades} ${unidades === 1 ? 'unidad' : 'unidades'} · ${formatoPrecio(valor)} si se venden todas`} />
          <ul>
            {stock.length === 0 && <li className="px-5 py-10 text-center text-sm text-ink-soft">No tienes sobrantes cargados.</li>}
            {stock.map(s => {
              const p = s.producto
              return (
                <li key={s.id} className={`flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-line-dark px-5 py-3.5 last:border-0 ${s.cantidad === 0 ? 'bg-[#f8fafd]' : ''}`}>
                  <span className="relative h-14 w-12 shrink-0 overflow-hidden rounded-md bg-[#e3ecf8]">
                    {p.fotos[0] && <Image src={p.fotos[0]} alt="" fill sizes="48px" className="object-cover" />}
                  </span>
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      {p.equipo.nombre} {p.nombre}
                      {!p.visible && <Chip clase="bg-amber-100 text-amber-800">Oculta</Chip>}
                    </p>
                    <p className="text-xs text-ink-soft">{p.tipo.nombre} · Talla <b className="text-navy-950">{s.talla}</b></p>
                    <Link href={`/producto/${p.slug}`} target="_blank" className="inline-flex items-center gap-1 text-xs text-navy-700 underline">
                      Ver en la tienda <ExternalLink size={11} aria-hidden />
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    <Sumar id={s.id} delta={-1} deshabilitado={s.cantidad === 0} etiqueta="Quitar una unidad"><Minus size={14} /></Sumar>
                    <span className="w-14 text-center">
                      <span className="display block text-2xl leading-none">{s.cantidad}</span>
                      <span className="text-[10px] text-ink-soft">{s.cantidad === 0 ? 'agotada' : 'quedan'}</span>
                    </span>
                    <Sumar id={s.id} delta={1} etiqueta="Agregar una unidad"><Plus size={14} /></Sumar>
                  </div>

                  <FormAccion accion={precioStockAccion} className="flex w-44 flex-col gap-1">
                    <input type="hidden" name="id" value={s.id} />
                    <div className="flex gap-1.5">
                      <label className="sr-only" htmlFor={`precio-${s.id}`}>Precio</label>
                      <input id={`precio-${s.id}`} name="precio" type="number" min={1} max={500} step="0.01" defaultValue={s.precio ?? ''} placeholder={`$${s.precioNormal}`} className={`${input} py-1.5`} />
                      <BotonEnviar className="rounded-lg border border-line-dark px-2.5 text-xs font-semibold hover:bg-admin-bg">OK</BotonEnviar>
                    </div>
                    <span className="text-[10px] text-ink-soft">{s.precio === null ? 'Precio normal' : `Rebajada (normal ${formatoPrecio(s.precioNormal)})`}</span>
                  </FormAccion>

                  <form action={eliminarStockAccion}>
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" aria-label={`Eliminar ${p.equipo.nombre} ${p.nombre} talla ${s.talla} del stock`} className="grid size-8 place-items-center rounded-lg text-red-700 hover:bg-red-50">
                      <Trash2 size={15} />
                    </button>
                  </form>
                </li>
              )
            })}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader titulo="Agregar sobrantes" subtitulo="Camisetas que ya están en Machala" />
            <FormStock camisetas={camisetas} />
          </Card>
          <Aviso>
            Al llegar un pedido la unidad se aparta sola. Si cancelas el pedido, vuelve al stock.
            No aparecen en la lista para el proveedor. Una camiseta oculta no se ve en la tienda aunque tenga stock.
          </Aviso>
        </div>
      </div>
    </>
  )
}
