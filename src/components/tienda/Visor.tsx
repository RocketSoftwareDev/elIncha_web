'use client'

import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

/**
 * Visor a pantalla completa de las fotos de una camiseta. La foto se ve ENTERA
 * (sin recorte); doble toque o doble clic acerca al punto tocado para ver detalles.
 * Esc cierra, ← → cambian de foto y en celular se desliza con el dedo.
 */
export function Visor({ fotos, inicial, alt, onCerrar }: { fotos: string[]; inicial: number; alt: string; onCerrar: () => void }) {
  const [i, setI] = useState(inicial)
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null)
  const toque = useRef<number | null>(null)
  const cerrar = useRef<HTMLButtonElement>(null)

  const ir = (n: number) => { setZoom(null); setI((n + fotos.length) % fotos.length) }

  useEffect(() => {
    const teclas = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
      if (e.key === 'ArrowRight') { setZoom(null); setI(n => (n + 1) % fotos.length) }
      if (e.key === 'ArrowLeft') { setZoom(null); setI(n => (n - 1 + fotos.length) % fotos.length) }
    }
    document.addEventListener('keydown', teclas)
    document.body.style.overflow = 'hidden'
    cerrar.current?.focus()
    return () => {
      document.removeEventListener('keydown', teclas)
      document.body.style.overflow = ''
    }
  }, [fotos.length, onCerrar])

  function acercar(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    setZoom(z => (z ? null : { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }))
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black" role="dialog" aria-modal="true" aria-label={`Fotos de ${alt}`}>
      <div className="flex items-center justify-between px-4 py-3">
        <span className="kicker text-[11px] text-white" aria-live="polite">{i + 1} / {fotos.length}</span>
        <button ref={cerrar} type="button" onClick={onCerrar} aria-label="Cerrar" className="grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
          <X size={20} />
        </button>
      </div>

      <div
        className="relative flex-1 touch-pan-y overflow-hidden"
        onDoubleClick={acercar}
        onTouchStart={e => { toque.current = e.touches[0].clientX }}
        onTouchEnd={e => {
          if (toque.current === null || zoom) return
          const dx = e.changedTouches[0].clientX - toque.current
          if (Math.abs(dx) > 50) ir(i + (dx < 0 ? 1 : -1))
          toque.current = null
        }}
      >
        <Image
          key={fotos[i]}
          src={fotos[i]}
          alt={`${alt} · foto ${i + 1}`}
          fill
          sizes="100vw"
          className="object-contain transition-transform duration-200"
          style={zoom ? { transform: 'scale(2.2)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
        />
        {fotos.length > 1 && (
          <>
            <button type="button" onClick={() => ir(i - 1)} aria-label="Foto anterior" className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronLeft size={22} /></button>
            <button type="button" onClick={() => ir(i + 1)} aria-label="Foto siguiente" className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronRight size={22} /></button>
          </>
        )}
      </div>

      {fotos.length > 1 && (
        <div className="no-scrollbar flex justify-center gap-2 overflow-x-auto px-4 pt-3">
          {fotos.map((f, k) => (
            <button key={f + k} type="button" onClick={() => ir(k)} aria-label={`Ver foto ${k + 1}`} aria-current={k === i ? 'true' : undefined}
              className={`relative h-[72px] w-14 shrink-0 overflow-hidden ${k === i ? 'ring-2 ring-white' : 'opacity-60 ring-1 ring-white/20'}`}>
              <Image src={f} alt="" fill sizes="56px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
      <p className="py-3 text-center text-xs text-white/60">{zoom ? 'Doble toque para alejar' : 'Desliza para cambiar · doble toque para acercar'}</p>
    </div>
  )
}
