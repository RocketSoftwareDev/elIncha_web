import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FichaProducto } from '@/components/tienda/producto/FichaProducto'
import { aceptaPedidos, resumenDrop } from '@/lib/domain/drop'
import { formatoPrecio } from '@/lib/domain/pricing'
import { combosActivos, dropActual, productoPorSlug, shortDelEquipo } from '@/lib/data/tienda'
import { RegistrarVistaProducto } from '@/lib/analitica/Registro'
import { ahora } from '@/lib/reloj'

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = await productoPorSlug((await params).slug)
  return p ? { title: `${p.equipo.nombre} ${p.nombre}`, description: `${p.tipo.nombre} · ${formatoPrecio(p.precio)} · Nombre y número gratis.` } : {}
}

export default async function Producto({ params }: Params) {
  const producto = await productoPorSlug((await params).slug)
  if (!producto) notFound()

  const [drop, combos, short] = await Promise.all([dropActual(), combosActivos(), shortDelEquipo(producto.equipoId)])
  const abierto = aceptaPedidos(drop, ahora())
  // El combo aplica si este producto es de un tipo del combo y el equipo tiene short.
  const combo = producto.tipo.esShort ? null : (combos.find(c => c.tipos.includes(producto.tipoId)) ?? null)

  return (
    <div className="px-4 pb-24 md:px-[72px]">
      <div className="mx-auto max-w-[1296px]">
        <nav aria-label="Ruta" className="kicker flex flex-wrap gap-2.5 py-6 text-muted">
          <Link href="/vitrina" className="hover:text-white">Vitrina</Link>/
          <Link href={`/vitrina?liga=${producto.liga.slug}`} className="hover:text-white">{producto.liga.nombre}</Link>/
          <span className="text-white">{producto.equipo.nombre} {producto.nombre}</span>
        </nav>
        <RegistrarVistaProducto productoId={producto.id} ruta={`/producto/${producto.slug}`} />
        <FichaProducto
          producto={producto}
          combo={combo && short ? { id: combo.id, nombre: combo.nombre, precio: combo.precio, precioSuelto: producto.precio + short.precio, fotoShort: short.fotos[0] } : null}
          drop={abierto ? { nombre: drop!.nombre, ...resumenDrop(drop!), cierraEn: drop!.cierraEn } : null}
        />
      </div>
    </div>
  )
}
