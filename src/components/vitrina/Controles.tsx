'use client'

import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ORDENES, urlVitrina, type Filtros, type Orden } from '@/lib/domain/vitrina'

/** Buscador por equipo o selección. Busca mientras escribes (con una pausa corta). */
export function Buscador({ filtros }: { filtros: Filtros }) {
  const router = useRouter()
  const [q, setQ] = useState(filtros.q)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (q.trim() === filtros.q) return
    const t = setTimeout(() => router.replace(urlVitrina(filtros, { q: q.trim() }), { scroll: false }), 350)
    return () => clearTimeout(t)
  }, [q, filtros, router])

  // Atajo «/» para ir al buscador, y foco directo si se llegó con #buscar.
  useEffect(() => {
    if (window.location.hash === '#buscar') input.current?.focus()
    const atajo = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        input.current?.focus()
      }
    }
    document.addEventListener('keydown', atajo)
    return () => document.removeEventListener('keydown', atajo)
  }, [])

  return (
    <form id="buscar" role="search" onSubmit={e => e.preventDefault()} className="flex h-[60px] w-full items-center gap-3 border border-sky bg-navy-900 px-5 lg:w-[520px]">
      <Search size={20} className="shrink-0 text-sky" aria-hidden />
      <input
        ref={input}
        value={q}
        onChange={e => setQ(e.target.value)}
        type="search"
        enterKeyHint="search"
        placeholder="Busca tu equipo o selección…"
        aria-label="Buscar equipo o selección"
        className="w-full bg-transparent text-base outline-none placeholder:text-[#6f7fa8] [&::-webkit-search-cancel-button]:hidden"
      />
      {q ? (
        <button type="button" onClick={() => setQ('')} aria-label="Borrar búsqueda" className="text-muted hover:text-white"><X size={18} /></button>
      ) : (
        <kbd className="hidden border border-line px-2 py-0.5 font-mono text-[11px] text-muted lg:block">/</kbd>
      )}
    </form>
  )
}

export function SelectorOrden({ filtros }: { filtros: Filtros }) {
  const router = useRouter()
  return (
    <label className="relative flex items-center gap-2 border border-line px-3.5 py-2.5 text-[13px] font-semibold">
      <span className="text-muted">Ordenar:</span>
      <select
        value={filtros.orden}
        onChange={e => router.replace(urlVitrina(filtros, { orden: e.target.value as Orden }), { scroll: false })}
        className="cursor-pointer appearance-none bg-transparent pr-5 outline-none"
      >
        {ORDENES.map(o => <option key={o.valor} value={o.valor} className="bg-navy-950">{o.etiqueta}</option>)}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3" aria-hidden />
    </label>
  )
}

/** En celular los filtros viven en un panel que sube desde abajo. */
export function FiltrosMovil({ activos, total, children }: { activos: number; total: number; children: React.ReactNode }) {
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    document.body.style.overflow = abierto ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [abierto])

  return (
    <>
      <button type="button" onClick={() => setAbierto(true)} className="flex items-center gap-2 border border-line px-3.5 py-2.5 text-[13px] font-semibold lg:hidden">
        <SlidersHorizontal size={15} aria-hidden /> Filtros{activos > 0 && <span className="grid size-5 place-items-center rounded-full bg-sky text-[11px] text-navy-950">{activos}</span>}
      </button>
      {abierto && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filtros">
          <button type="button" aria-label="Cerrar filtros" onClick={() => setAbierto(false)} className="absolute inset-0 bg-navy-950/70" />
          {/* Al tocar un filtro (un enlace) se cierra el panel y se ven los resultados. */}
          <div onClick={e => { if ((e.target as HTMLElement).closest('a')) setAbierto(false) }} className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto bg-navy-950 px-5 pb-28 pt-5">
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/25" />
            {children}
          </div>
          <div className="absolute inset-x-0 bottom-0 border-t border-line bg-navy-950 p-4">
            <button type="button" onClick={() => setAbierto(false)} className="kicker h-14 w-full bg-sky font-bold text-navy-950">Ver {total} {total === 1 ? 'camiseta' : 'camisetas'}</button>
          </div>
        </div>
      )}
    </>
  )
}
