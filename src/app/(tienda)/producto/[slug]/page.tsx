import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FichaProducto } from '@/components/tienda/producto/FichaProducto'
import { aceptaPedidos, resumenDrop } from '@/lib/domain/drop'
import { formatoPrecio } from '@/lib/domain/pricing'
import { combosActivos, dropActual, productoPorSlug, shortsActivos, soportePublico, tipos } from '@/lib/data/tienda'
import { RegistrarVistaProducto } from '@/lib/analitica/Registro'
import { ahora } from '@/lib/reloj'

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = await productoPorSlug((await params).slug)
  return p ? { title: `${p.equipo.nombre} ${p.nombre}`, description: `${p.tipo.nombre} · ${formatoPrecio(p.precio)}${p.tipo.aceptaPersonalizacion ? ' · Nombre y número gratis.' : ''}` } : {}
}

export default async function Producto({ params, searchParams }: Params & { searchParams: Promise<{ modo?: string }> }) {
  const producto = await productoPorSlug((await params).slug)
  if (!producto) notFound()
  // Desde el apartado «Entrega inmediata» la ficha abre en ese modo.
  const inmediata = (await searchParams).modo === 'inmediata' && producto.stock.length > 0

  const [drop, combos, shorts, listaTipos, soporte] = await Promise.all([dropActual(), combosActivos(), shortsActivos(), tipos(), soportePublico()])
  // Si el admin publicó una guía de tallas en Soporte, se enlaza junto a la talla.
  const guia = soporte.find(s => s.id === 'guia-de-tallas') ?? soporte.find(s => /talla/i.test(s.titulo))
  const abierto = aceptaPedidos(drop, ahora())
  // El combo aplica si este producto es de un tipo del combo y hay pantalonetas para elegir.
  const combo = producto.tipo.esShort || shorts.length === 0 ? null : (combos.find(c => c.tipos.includes(producto.tipoId)) ?? null)
  // «Precio suelto» de referencia: camiseta + el short del combo comprados por separado.
  const precioShort = listaTipos.find(t => t.esShort && combo?.tipos.includes(t.id))?.precio ?? 0

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
          combo={combo ? {
            id: combo.id, nombre: combo.nombre, precio: combo.precio, precioSuelto: producto.precio + precioShort,
            shorts: shorts.map(s => ({ id: s.id, nombre: s.nombre, foto: s.foto, extra: s.extra, tallas: s.tallas })),
          } : null}
          drop={abierto ? { nombre: drop!.nombre, ...resumenDrop(drop!), cierraEn: drop!.cierraEn } : null}
          inmediata={inmediata}
          guiaTallas={guia ? `/soporte#${guia.id}` : null}
        />
      </div>
    </div>
  )
}
