import Link from 'next/link'
import { formatoPrecio } from '@/lib/domain/pricing'
import type { Equipo, Liga, TipoPrenda } from '@/lib/domain/types'
import { alternar, idCorto, urlVitrina, type Filtros as F } from '@/lib/domain/vitrina'
import { ListaFiltro } from './FiltroEquipos'

interface Props {
  filtros: F
  ligas: Liga[]
  tipos: TipoPrenda[]
  equipos: Equipo[]
  porLiga: Map<string, number>
  porTipo: Map<string, number>
  porEquipo: Map<string, number>
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
  const hayFiltros = f.ligas.length + f.tipos.length + f.equipos.length > 0 || f.parches || f.inmediata
  // Equipos que tienen algo con los filtros actuales; si hay ligas elegidas, solo de esas ligas.
  const equiposVisibles = equipos
    .filter(e => (porEquipo.get(idCorto(e.id)) ?? 0) > 0 || f.equipos.includes(idCorto(e.id)))
    .map(e => {
      const id = idCorto(e.id)
      return { id, nombre: e.nombre, imagen: e.escudo, cantidad: porEquipo.get(id) ?? 0, marcado: f.equipos.includes(id), href: urlVitrina(f, { equipos: alternar(f.equipos, id) }) }
    })

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <p className="kicker font-bold text-sky">Filtrar</p>
        {hayFiltros && <Link href={urlVitrina(f, { ligas: [], tipos: [], equipos: [], parches: false, inmediata: false })} scroll={false} className="text-[13px] text-muted underline hover:text-white">Limpiar</Link>}
      </div>

      <Grupo titulo="Liga">
        <ListaFiltro nombre="liga" conImagen redonda opciones={ligas.map(l => ({
          id: l.id, nombre: l.nombre, imagen: l.foto, cantidad: porLiga.get(l.slug) ?? 0,
          marcado: f.ligas.includes(l.slug), href: urlVitrina(f, { ligas: alternar(f.ligas, l.slug) }),
        }))} />
      </Grupo>

      <Grupo titulo="Producto">
        <ListaFiltro nombre="producto" opciones={tipos.map(t => {
          const id = idCorto(t.id)
          return { id, nombre: t.nombre, detalle: formatoPrecio(t.precio), cantidad: porTipo.get(id) ?? 0, marcado: f.tipos.includes(id), href: urlVitrina(f, { tipos: alternar(f.tipos, id) }) }
        })} />
      </Grupo>

      <Grupo titulo="Equipo">
        <ListaFiltro nombre="equipo" conImagen opciones={equiposVisibles} />
      </Grupo>

      <Interruptor etiqueta="Entrega inmediata" on={f.inmediata} href={urlVitrina(f, { inmediata: !f.inmediata })} />
      <Interruptor etiqueta="Solo con parches" on={f.parches} href={urlVitrina(f, { parches: !f.parches })} />
    </div>
  )
}

function Interruptor({ etiqueta, on, href }: { etiqueta: string; on: boolean; href: string }) {
  return (
    <Link href={href} scroll={false} role="switch" aria-checked={on} className="flex items-center justify-between">
      <span className="text-sm font-semibold">{etiqueta}</span>
      <span className={`flex h-[22px] w-10 items-center rounded-full p-[3px] transition ${on ? 'justify-end bg-sky' : 'justify-start bg-white/15'}`}>
        <span className={`size-4 rounded-full ${on ? 'bg-navy-950' : 'bg-white'}`} />
      </span>
    </Link>
  )
}
