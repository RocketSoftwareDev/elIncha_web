'use client'

import Image from 'next/image'
import { PencilLine } from 'lucide-react'
import { VistaPreviaCamiseta, VistaPreviaShort } from '@/components/dorsal/VistaPreviaDorsal'
import { useDorsal } from './producto/DorsalContexto'

const FANTASMA = 'rgb(10 26 68 / 0.22)'

/**
 * Galería de la ficha. Si la prenda se personaliza, la primera diapositiva es la
 * escena «Tu dorsal» con la silueta genérica; las demás son fotos reales SIN
 * personalización, para no dar a entender que solo una camiseta se personaliza.
 */
export function Galeria({ fotos, alt, personalizable, esShort }: { fotos: string[]; alt: string; personalizable: boolean; esShort: boolean }) {
  const { nombre, numero, personalizar, diapositiva, setDiapositiva } = useDorsal()
  const conEscena = personalizable && personalizar
  const offset = conEscena ? 1 : 0
  const total = fotos.length + offset
  const actual = Math.min(diapositiva, total - 1)
  const enEscena = conEscena && actual === 0

  return (
    // Fija al bajar: la vista previa sigue a la vista mientras se completa el formulario.
    <div className="flex flex-1 flex-col-reverse gap-4 md:flex-row lg:sticky lg:top-28 lg:self-start">
      {total > 1 && (
        <div className="no-scrollbar flex gap-3 overflow-x-auto md:flex-col">
          {conEscena && (
            <Miniatura activa={actual === 0} onClick={() => setDiapositiva(0)} etiqueta="Ver tu dorsal">
              <span className="flex size-full flex-col items-center justify-center gap-1 bg-navy-900 px-2">
                {esShort
                  ? <VistaPreviaShort numero={numero} className="w-full" />
                  : <VistaPreviaCamiseta nombre={nombre.trim()} numero={numero} className="w-full" />}
                <span className="kicker text-[8px] text-sky">Tu dorsal</span>
              </span>
            </Miniatura>
          )}
          {fotos.map((f, k) => (
            <Miniatura key={f + k} activa={actual === k + offset} onClick={() => setDiapositiva(k + offset)} etiqueta={`Ver foto ${k + 1}`}>
              <Image src={f} alt="" fill sizes="88px" className="object-cover" />
            </Miniatura>
          ))}
        </div>
      )}

      <div className="relative aspect-[4/5] flex-1 overflow-hidden border border-line bg-navy-800 lg:aspect-auto lg:h-[min(720px,calc(100dvh-8rem))]">
        {enEscena ? (
          <div className="absolute inset-0 bg-navy-900 bg-[radial-gradient(ellipse_at_50%_45%,rgb(30_58_138/0.85),transparent_65%)]">
            <span className="kicker absolute left-6 top-6 z-10 flex items-center gap-2 bg-sky px-3 py-2 text-[11px] font-bold text-navy-950">
              <PencilLine size={14} aria-hidden /> Tu dorsal · en vivo
            </span>
            <p className="display pointer-events-none absolute -bottom-6 left-6 select-none whitespace-nowrap text-[clamp(96px,14vw,180px)] text-sky/[0.06]" aria-hidden>Tu dorsal</p>
            <div className="absolute inset-0 flex items-center justify-center p-10">
              {esShort ? (
                <VistaPreviaShort numero={numero || '10'} color={numero ? undefined : FANTASMA} className="w-[min(80%,420px)] drop-shadow-[0_30px_30px_rgb(0_0_0/0.45)]" />
              ) : (
                <VistaPreviaCamiseta
                  nombre={nombre.trim() || 'TU NOMBRE'}
                  numero={numero || '10'}
                  color={nombre || numero ? undefined : FANTASMA}
                  className="w-[min(78%,420px)] drop-shadow-[0_30px_30px_rgb(0_0_0/0.45)]"
                />
              )}
            </div>
            <p className="kicker absolute bottom-5 left-6 z-10 text-[10px] text-muted md:text-[11px]">Vista previa referencial · se actualiza mientras escribes</p>
          </div>
        ) : (
          <Image src={fotos[actual - offset]} alt={alt} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        )}
      </div>
    </div>
  )
}

function Miniatura({ activa, onClick, etiqueta, children }: { activa: boolean; onClick: () => void; etiqueta: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      aria-current={activa ? 'true' : undefined}
      className={`relative h-[110px] w-[88px] shrink-0 overflow-hidden bg-navy-800 ${activa ? 'ring-2 ring-sky' : 'ring-1 ring-line'}`}
    >
      {children}
    </button>
  )
}
