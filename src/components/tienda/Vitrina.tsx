import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Plus } from 'lucide-react'
import { formatoPrecio } from '@/lib/domain/pricing'
import type { Liga, ProductoVista } from '@/lib/domain/types'

export function Vitrina({ ligas, productos, ligaActual }: { ligas: Liga[]; productos: ProductoVista[]; ligaActual: Liga | null }) {
  return (
    <section id="vitrina" className="scroll-mt-24 bg-navy-950 px-4 pb-20 pt-12 md:px-[72px] md:pb-[88px] md:pt-16">
      <div className="mx-auto max-w-[1296px] space-y-10 md:space-y-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="kicker text-sky">01 — La vitrina</p>
            <h2 className="display text-5xl md:text-7xl">Elige tu liga</h2>
          </div>
          <p className="font-script text-xl text-sky md:text-[22px]">Toca un círculo y filtra la vitrina →</p>
        </div>

        <nav aria-label="Ligas" className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 md:mx-0 md:justify-between md:px-0">
          {ligas.map(l => {
            const activa = ligaActual?.id === l.id
            return (
              <Link
                key={l.id}
                href={activa ? '/#vitrina' : `/?liga=${l.slug}#vitrina`}
                scroll={false}
                aria-current={activa ? 'true' : undefined}
                className="group flex shrink-0 flex-col items-center gap-3.5"
              >
                <span className={`relative size-[72px] overflow-hidden rounded-full md:size-32 ${activa ? 'ring-[3px] ring-sky' : 'ring-1 ring-line group-hover:ring-sky/60'}`}>
                  <Image src={l.foto} alt="" fill sizes="128px" className="object-cover transition duration-300 group-hover:scale-105" />
                </span>
                <span className={`kicker text-[9px] font-bold md:text-xs ${activa ? 'text-sky' : 'text-white'}`}>{l.nombre}</span>
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center justify-between border-b border-line pb-5">
          <p className="font-mono text-[13px] text-muted">
            {productos.length} {productos.length === 1 ? 'camiseta' : 'camisetas'}{ligaActual ? ` · ${ligaActual.nombre}` : ' · todas las ligas'}
          </p>
          {ligaActual && <Link href="/#vitrina" scroll={false} className="text-sm underline">Ver todas</Link>}
        </div>

        {productos.length === 0 ? (
          <p className="py-16 text-center text-muted">Pronto subimos camisetas de esta liga.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-8">
            {productos.map(p => <TarjetaProducto key={p.id} producto={p} />)}
          </ul>
        )}
      </div>
    </section>
  )
}

export function TarjetaProducto({ producto: p }: { producto: ProductoVista }) {
  const nombre = `${p.equipo.nombre} ${p.nombre}`
  return (
    <li>
      <Link href={`/producto/${p.slug}`} className="group block space-y-3.5">
        <div className="relative aspect-[300/340] overflow-hidden bg-navy-800">
          <Image src={p.fotos[0]} alt={nombre} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover transition duration-500 group-hover:scale-105" />
          <span className="kicker absolute left-3 top-3 bg-sky px-2 py-1 text-[10px] font-bold text-navy-950">{p.liga.nombre}</span>
          <span className="kicker absolute inset-x-3 bottom-3 hidden items-center justify-center gap-2 bg-white py-3 text-xs font-bold text-navy-950 opacity-0 transition group-hover:opacity-100 md:flex">
            <Plus size={16} aria-hidden /> Personalizar
          </span>
          <span className="absolute bottom-2 right-2 grid size-9 place-items-center bg-white text-navy-950 md:hidden" aria-hidden><Plus size={18} /></span>
        </div>
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-semibold leading-snug md:text-base">{nombre}</p>
            <p className="display text-xl text-sky md:text-2xl">{formatoPrecio(p.precio)}</p>
          </div>
          <p className="text-xs text-muted md:text-[13px]">
            {p.tipo.nombre}{p.tipo.aceptaPersonalizacion ? (p.tipo.esShort ? ' · Número gratis' : ' · Nombre y número gratis') : ''}
          </p>
        </div>
      </Link>
    </li>
  )
}

export function VerMas() {
  return (
    <Link href="/#vitrina" className="kicker inline-flex items-center gap-2 border border-white px-7 py-4 font-bold">
      Ver toda la vitrina <ArrowRight size={16} aria-hidden />
    </Link>
  )
}
