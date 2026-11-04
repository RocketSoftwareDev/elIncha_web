'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Check, Search, X } from 'lucide-react'
import { useState } from 'react'
import { normalizar } from '@/lib/domain/vitrina'

export interface OpcionFiltro {
  id: string
  nombre: string
  /** Escudo o foto de la liga; sin imagen se muestra la inicial si `conImagen`. */
  imagen?: string
  /** Texto a la derecha, ej. el precio del tipo de prenda. */
  detalle?: string
  cantidad: number
  marcado: boolean
  href: string
}

/** Con 3 opciones o menos: lista simple. Con más: buscador y se muestran 5 + «ver más». */
const MAX_SIN_BUSCADOR = 3
const VISIBLES = 5

export function ListaFiltro({ opciones, nombre, conImagen = false, redonda = false }: { opciones: OpcionFiltro[]; nombre: string; conImagen?: boolean; redonda?: boolean }) {
  const [q, setQ] = useState('')
  const [todos, setTodos] = useState(false)
  const conBuscador = opciones.length > MAX_SIN_BUSCADOR
  const lista = opciones.filter(o => normalizar(o.nombre).includes(normalizar(q.trim())))
  // Los marcados siempre a la vista, aunque estén más abajo.
  const ordenados = [...lista.filter(o => o.marcado), ...lista.filter(o => !o.marcado)]
  const mostrados = !conBuscador || todos || q ? ordenados : ordenados.slice(0, VISIBLES)
  const ocultos = ordenados.length - mostrados.length

  return (
    <>
      {conBuscador && (
        <label className="flex items-center gap-2 border border-line bg-navy-900 px-3 py-2.5 focus-within:border-sky">
          <Search size={14} className="shrink-0 text-muted" aria-hidden />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={`Buscar ${nombre}…`} aria-label={`Buscar ${nombre} en los filtros`} className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#6f7fa8]" />
          {q && <button type="button" onClick={() => setQ('')} aria-label="Borrar búsqueda"><X size={14} className="text-muted" /></button>}
        </label>
      )}
      {mostrados.map(o => (
        <Link key={o.id} href={o.href} scroll={false} aria-pressed={o.marcado} className={`flex items-center gap-3 ${o.cantidad === 0 && !o.marcado ? 'opacity-40' : ''}`}>
          <span className={`grid size-[18px] shrink-0 place-items-center border ${o.marcado ? 'border-sky bg-sky' : 'border-white/25'}`} aria-hidden>
            {o.marcado && <Check size={12} className="text-navy-950" strokeWidth={3} />}
          </span>
          {conImagen && (
            <span className={`relative grid size-7 shrink-0 place-items-center overflow-hidden text-xs font-bold text-sky ${redonda ? `rounded-full ${o.imagen ? 'bg-white' : 'bg-navy-800'}` : ''}`}>
              {o.imagen ? <Image src={o.imagen} alt="" fill sizes="28px" className={`object-contain ${redonda ? 'p-[3px]' : ''}`} /> : o.nombre.slice(0, 1)}
            </span>
          )}
          <span className={`flex-1 text-sm ${o.marcado ? 'font-semibold text-white' : 'text-[#d6def0]'}`}>{o.nombre}</span>
          {o.detalle && <span className="display text-lg text-sky">{o.detalle}</span>}
          <span className="w-5 text-right font-mono text-[11px] text-muted">{o.cantidad}</span>
        </Link>
      ))}
      {lista.length === 0 && <p className="text-[13px] text-muted">Nada coincide con «{q}».</p>}
      {ocultos > 0 && (
        <button type="button" onClick={() => setTodos(true)} className="text-[13px] text-sky underline">Ver {ocultos} más</button>
      )}
    </>
  )
}
