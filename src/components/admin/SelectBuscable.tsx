'use client'

import Image from 'next/image'
import { Check, ChevronDown, Search } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { normalizar } from '@/lib/domain/vitrina'
import { input } from './ui'

export interface OpcionSelect { id: string; nombre: string; imagen?: string }

/**
 * Selector del admin. Con 3 opciones o menos es un <select> normal; con más,
 * se abre una lista con buscador (sin tildes: «munich» encuentra «Múnich»).
 * Teclado: ↑ ↓ para moverse, Enter para elegir, Esc para cerrar.
 */
export function SelectBuscable({ opciones, valor, onChange, name, vacio, etiqueta }: {
  opciones: OpcionSelect[]; valor: string; onChange: (id: string) => void; name?: string; vacio: string; etiqueta: string
}) {
  const [abierto, setAbierto] = useState(false)
  const [q, setQ] = useState('')
  const [activo, setActivo] = useState(0)
  const caja = useRef<HTMLDivElement>(null)
  const idLista = useId()

  useEffect(() => {
    if (!abierto) return
    const fuera = (e: MouseEvent) => { if (!caja.current?.contains(e.target as Node)) setAbierto(false) }
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [abierto])

  if (opciones.length <= 3) {
    return (
      <select name={name} value={valor} onChange={e => onChange(e.target.value)} className={input} aria-label={etiqueta} required>
        {opciones.length === 0 && <option value="">{vacio}</option>}
        {opciones.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
      </select>
    )
  }

  const lista = opciones.filter(o => normalizar(o.nombre).includes(normalizar(q.trim())))
  const elegido = opciones.find(o => o.id === valor)
  const elegir = (id: string) => { onChange(id); setAbierto(false); setQ('') }

  return (
    <div ref={caja} className="relative">
      {name && <input type="hidden" name={name} value={valor} />}
      <button type="button" onClick={() => { setAbierto(v => !v); setActivo(0) }} aria-haspopup="listbox" aria-expanded={abierto} aria-label={etiqueta}
        className={`${input} flex items-center justify-between gap-2 text-left`}>
        <span className={elegido ? '' : 'text-ink-soft'}>{elegido?.nombre ?? vacio}</span>
        <ChevronDown size={16} className="shrink-0 text-ink-soft" aria-hidden />
      </button>
      {abierto && (
        <div className="absolute inset-x-0 top-full z-20 mt-1 space-y-1 rounded-xl border border-line-dark bg-white p-1.5 shadow-xl">
          <label className="flex items-center gap-2 rounded-lg border border-navy-950 px-2.5 py-2">
            <Search size={14} className="text-ink-soft" aria-hidden />
            <input
              autoFocus
              value={q}
              onChange={e => { setQ(e.target.value); setActivo(0) }}
              onKeyDown={e => {
                if (e.key === 'ArrowDown') { e.preventDefault(); setActivo(a => Math.min(a + 1, lista.length - 1)) }
                if (e.key === 'ArrowUp') { e.preventDefault(); setActivo(a => Math.max(a - 1, 0)) }
                if (e.key === 'Enter') { e.preventDefault(); if (lista[activo]) elegir(lista[activo].id) }
                if (e.key === 'Escape') setAbierto(false)
              }}
              placeholder={`Buscar ${etiqueta.toLowerCase()}…`}
              aria-controls={idLista}
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>
          <ul id={idLista} role="listbox" aria-label={etiqueta} className="max-h-60 overflow-y-auto">
            {lista.map((o, i) => (
              <li key={o.id} role="option" aria-selected={o.id === valor}>
                <button type="button" onMouseEnter={() => setActivo(i)} onClick={() => elegir(o.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm ${i === activo ? 'bg-[#eaf3fe]' : ''} ${o.id === valor ? 'font-bold' : ''}`}>
                  {o.imagen !== undefined && (
                    <span className="relative size-5 shrink-0 overflow-hidden rounded-full bg-[#e3ecf8]">
                      {o.imagen && <Image src={o.imagen} alt="" fill sizes="20px" className="object-contain" />}
                    </span>
                  )}
                  <span className="flex-1">{o.nombre}</span>
                  {o.id === valor && <Check size={14} aria-hidden />}
                </button>
              </li>
            ))}
            {lista.length === 0 && <li className="px-2.5 py-2 text-sm text-ink-soft">Nada coincide con «{q}».</li>}
          </ul>
          <p className="px-2.5 pb-1 text-[11px] text-ink-soft">{lista.length} de {opciones.length} · ↑↓ y Enter para elegir</p>
        </div>
      )}
    </div>
  )
}
