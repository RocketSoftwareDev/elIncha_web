import Image from 'next/image'
import Link from 'next/link'
import { PencilLine, Zap } from 'lucide-react'
import { Precio } from '@/components/Precio'
import type { ProductoVista } from '@/lib/domain/types'

/**
 * Tarjeta de la vitrina. Todas llevan a la ficha, donde se personaliza.
 * En el apartado «Entrega inmediata» muestra el precio y las tallas del stock, y la
 * ficha abre directo en ese modo (sin personalizar).
 */
export function TarjetaProducto({ producto: p, inmediata = false }: { producto: ProductoVista; inmediata?: boolean }) {
  const nombre = `${p.equipo.nombre} ${p.nombre}`
  const conStock = p.stock.length > 0
  const soloStock = inmediata && conStock
  const personaliza = !soloStock && p.tipo.aceptaPersonalizacion ? (p.tipo.esShort ? 'Número gratis' : 'Nombre y número gratis') : null
  const precio = soloStock ? Math.min(...p.stock.map(s => s.precio)) : p.precio
  return (
    <li>
      <Link href={soloStock ? `/producto/${p.slug}?modo=inmediata` : `/producto/${p.slug}`} className="group block space-y-3.5">
        <div className="relative aspect-[300/340] overflow-hidden bg-navy-800">
          {p.fotos[0] && <Image src={p.fotos[0]} alt={nombre} fill sizes="(min-width: 1024px) 22vw, 50vw" className="object-cover transition duration-500 group-hover:scale-105" />}
          <span className="kicker absolute left-3 top-3 bg-sky px-2 py-1 text-[10px] font-bold text-navy-950">{p.liga.nombre}</span>
          {conStock && (
            <span className="kicker absolute right-3 top-3 flex items-center gap-1 bg-whatsapp px-2 py-1 text-[10px] font-bold text-navy-950">
              <Zap size={11} aria-hidden /> Entrega inmediata
            </span>
          )}
          {personaliza && (
            <span className="kicker absolute inset-x-3 bottom-3 flex items-center justify-center gap-2 bg-white py-2.5 text-[10px] font-bold text-navy-950 md:py-3 md:text-xs md:opacity-0 md:transition md:group-hover:opacity-100">
              <PencilLine size={14} aria-hidden /> Personalizar
            </span>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-semibold leading-snug md:text-base">{nombre}</p>
            <span className="flex shrink-0 flex-col items-end">
              <Precio valor={precio} className="display text-xl text-sky md:text-2xl" />
              {soloStock && precio < p.precio && <Precio valor={p.precio} tachado className="text-xs text-muted" />}
            </span>
          </div>
          <p className="text-xs text-muted md:text-[13px]">
            {soloStock
              ? `Tallas ${p.stock.map(s => s.talla).join(' · ')} · tal cual, sin personalizar`
              : `${p.tipo.nombre}${personaliza ? ` · ${personaliza}` : ''}`}
          </p>
        </div>
      </Link>
    </li>
  )
}
