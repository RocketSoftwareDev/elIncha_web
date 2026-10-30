'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Check, Search } from 'lucide-react'
import { useState } from 'react'
import { normalizar } from '@/lib/domain/vitrina'

interface EquipoFiltro { id: string; nombre: string; escudo: string; cantidad: number; marcado: boolean; href: string }

const VISIBLES = 6

export function FiltroEquipos({ equipos }: { equipos: EquipoFiltro[] }) {
  const [q, setQ] = useState('')
  const [todos, setTodos] = useState(false)
  const lista = equipos.filter(e => normalizar(e.nombre).includes(normalizar(q)))
  // Los marcados siempre a la vista, aunque estén más abajo.
  const ordenados = [...lista.filter(e => e.marcado), ...lista.filter(e => !e.marcado)]
  const mostrados = todos || q ? ordenados : ordenados.slice(0, VISIBLES)
  const ocultos = ordenados.length - mostrados.length

  return (
    <>
      <label className="flex items-center gap-2 border border-line bg-navy-900 px-3 py-2.5">
        <Search size={14} className="text-muted" aria-hidden />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar equipo" aria-label="Buscar equipo en los filtros" className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#6f7fa8]" />
      </label>
      {mostrados.map(e => (
        <Link key={e.id} href={e.href} scroll={false} aria-pressed={e.marcado} className="flex items-center gap-3">
          <span className={`grid size-[18px] shrink-0 place-items-center border ${e.marcado ? 'border-sky bg-sky' : 'border-white/25'}`} aria-hidden>
            {e.marcado && <Check size={12} className="text-navy-950" strokeWidth={3} />}
          </span>
          {e.escudo && <Image src={e.escudo} alt="" width={20} height={20} className="size-5 shrink-0 object-contain" />}
          <span className={`flex-1 text-sm ${e.marcado ? 'font-semibold text-white' : 'text-[#d6def0]'}`}>{e.nombre}</span>
          <span className="font-mono text-[11px] text-muted">{e.cantidad}</span>
        </Link>
      ))}
      {lista.length === 0 && <p className="text-[13px] text-muted">Ningún equipo coincide.</p>}
      {ocultos > 0 && (
        <button type="button" onClick={() => setTodos(true)} className="text-[13px] text-sky underline">+ {ocultos} {ocultos === 1 ? 'equipo' : 'equipos'} más</button>
      )}
    </>
  )
}
