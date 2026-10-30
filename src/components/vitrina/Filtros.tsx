import Image from 'next/image'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { formatoPrecio } from '@/lib/domain/pricing'
import type { Equipo, Liga, TipoPrenda } from '@/lib/domain/types'
import { alternar, idCorto, urlVitrina, type Filtros as F } from '@/lib/domain/vitrina'
import { FiltroEquipos } from './FiltroEquipos'

interface Props {
  filtros: F
  ligas: Liga[]
  tipos: TipoPrenda[]
  equipos: Equipo[]
  porLiga: Map<string, number>
  porTipo: Map<string, number>
  porEquipo: Map<string, number>
}

function Casilla({ marcada }: { marcada: boolean }) {
  return (
    <span className={`grid size-[18px] shrink-0 place-items-center border ${marcada ? 'border-sky bg-sky' : 'border-white/25'}`} aria-hidden>
      {marcada && <Check size={12} className="text-navy-950" strokeWidth={3} />}
    </span>
  )
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <details open className="group border-b border-line pb-6">
      <summary className="mb-3 flex cursor-pointer list-none items-center justify-between text-[15px] font-bold [&::-webkit-details-marker]:hidden">
        {titulo}
        <span className="text-muted transition group-open:rotate-180" aria-hidden>⌃</span>
      </summary>
      <div className="space-y-3">{children}</div>
    </details>
  )
}

export function Filtros({ filtros: f, ligas, tipos, equipos, porLiga, porTipo, porEquipo }: Props) {
  const hayFiltros = f.ligas.length + f.tipos.length + f.equipos.length > 0 || f.parches
  // Equipos que tienen algo con los filtros actuales; si hay ligas elegidas, solo de esas ligas.
  const equiposVisibles = equipos
    .filter(e => (porEquipo.get(idCorto(e.id)) ?? 0) > 0 || f.equipos.includes(idCorto(e.id)))
    .map(e => {
      const id = idCorto(e.id)
      return { id, nombre: e.nombre, escudo: e.escudo, cantidad: porEquipo.get(id) ?? 0, marcado: f.equipos.includes(id), href: urlVitrina(f, { equipos: alternar(f.equipos, id) }) }
    })

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <p className="kicker font-bold text-sky">Filtrar</p>
        {hayFiltros && <Link href={urlVitrina(f, { ligas: [], tipos: [], equipos: [], parches: false })} scroll={false} className="text-[13px] text-muted underline hover:text-white">Limpiar</Link>}
      </div>

      <Grupo titulo="Liga">
        {ligas.map(l => {
          const on = f.ligas.includes(l.slug)
          const n = porLiga.get(l.slug) ?? 0
          return (
            <Link key={l.id} href={urlVitrina(f, { ligas: alternar(f.ligas, l.slug) })} scroll={false} aria-pressed={on} className={`flex items-center gap-3 ${n === 0 && !on ? 'opacity-40' : ''}`}>
              <Casilla marcada={on} />
              <span className="relative grid size-7 shrink-0 place-items-center overflow-hidden rounded-full bg-navy-800 text-xs font-bold text-sky">
                {l.foto ? <Image src={l.foto} alt="" fill sizes="28px" className="object-cover" /> : l.nombre.slice(0, 1)}
              </span>
              <span className={`flex-1 text-sm ${on ? 'font-semibold text-white' : 'text-[#d6def0]'}`}>{l.nombre}</span>
              <span className="font-mono text-[11px] text-muted">{n}</span>
            </Link>
          )
        })}
      </Grupo>

      <Grupo titulo="Producto">
        {tipos.map(t => {
          const id = idCorto(t.id)
          const on = f.tipos.includes(id)
          const n = porTipo.get(id) ?? 0
          return (
            <Link key={t.id} href={urlVitrina(f, { tipos: alternar(f.tipos, id) })} scroll={false} aria-pressed={on} className={`flex items-center gap-3 ${n === 0 && !on ? 'opacity-40' : ''}`}>
              <Casilla marcada={on} />
              <span className={`flex-1 text-sm ${on ? 'font-semibold text-white' : 'text-[#d6def0]'}`}>{t.nombre}</span>
              <span className="display text-lg text-sky">{formatoPrecio(t.precio)}</span>
              <span className="w-5 text-right font-mono text-[11px] text-muted">{n}</span>
            </Link>
          )
        })}
      </Grupo>

      <Grupo titulo="Equipo">
        <FiltroEquipos equipos={equiposVisibles} />
      </Grupo>

      <Link href={urlVitrina(f, { parches: !f.parches })} scroll={false} role="switch" aria-checked={f.parches} className="flex items-center justify-between">
        <span className="text-sm font-semibold">Solo con parches</span>
        <span className={`flex h-[22px] w-10 items-center rounded-full p-[3px] transition ${f.parches ? 'justify-end bg-sky' : 'justify-start bg-white/15'}`}>
          <span className={`size-4 rounded-full ${f.parches ? 'bg-navy-950' : 'bg-white'}`} />
        </span>
      </Link>
    </div>
  )
}
