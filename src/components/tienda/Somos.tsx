'use client'

import Image from 'next/image'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useState } from 'react'

const FOTOS = [
  { src: '/mock/somos-1.png', alt: 'Hinchas alentando en la tribuna' },
  { src: '/mock/somos-2.jpg', alt: 'Hinchas en el estadio' },
  { src: '/mock/liga-nacionales.jpg', alt: 'Fútbol ecuatoriano' },
]

const PILARES = [
  ['01', 'Calidad', 'Tela transpirable, escudos bordados y estampado que aguanta la lavadora.'],
  ['02', 'Misión', 'Que cada hincha de El Oro vista la de su equipo sin pagar de más.'],
  ['03', 'Visión', 'Ser la tienda de camisetas de referencia del sur del Ecuador.'],
]

export function Somos() {
  const [i, setI] = useState(0)
  const mover = (d: number) => setI(x => (x + d + FOTOS.length) % FOTOS.length)
  const siguiente = FOTOS[(i + 1) % FOTOS.length]

  return (
    <section id="nosotros" className="scroll-mt-24 bg-sky-soft px-4 py-20 text-navy-950 md:px-[72px] md:py-28">
      <div className="mx-auto flex max-w-[1296px] flex-col gap-14 md:flex-row md:items-center md:gap-[72px]">
        <div className="w-full md:w-[620px]">
          <div className="relative aspect-[620/600]">
            <div className="absolute right-0 top-[10%] h-[80%] w-[29%] overflow-hidden bg-navy-700 opacity-90">
              <Image src={siguiente.src} alt="" fill sizes="180px" className="object-cover" />
            </div>
            <div className="absolute left-0 top-0 h-full w-[84%] overflow-hidden bg-navy-800">
              <Image src={FOTOS[i].src} alt={FOTOS[i].alt} fill sizes="(min-width: 768px) 520px, 84vw" className="object-cover" />
            </div>
          </div>
          <div className="mt-3 flex w-[84%] items-center justify-between">
            <div className="flex items-center gap-2" aria-hidden>
              {FOTOS.map((_, k) => <span key={k} className={`h-2 rounded-full transition-all ${k === i ? 'w-8 bg-navy-950' : 'w-2 bg-navy-900/25'}`} />)}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => mover(-1)} aria-label="Foto anterior" className="grid size-11 place-items-center rounded-full border border-navy-950"><ArrowLeft size={18} /></button>
              <button type="button" onClick={() => mover(1)} aria-label="Foto siguiente" className="grid size-11 place-items-center rounded-full border border-navy-950"><ArrowRight size={18} /></button>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-7">
          <p className="kicker text-navy-700">02 — Por qué nosotros</p>
          <h2 className="display text-[clamp(52px,6vw,76px)] leading-[0.95]">Somos hinchas,<br />no revendedores.</h2>
          <p className="text-lg leading-relaxed text-navy-800">Nacimos en las gradas de Machala. Elegimos cada camiseta como si fuera para nosotros: la tela, el escudo, el dorsal.</p>
          <dl>
            {PILARES.map(([n, t, d]) => (
              <div key={n} className="flex gap-6 border-t border-navy-900/15 py-5">
                <dt className="font-mono text-sm text-navy-700">{n}</dt>
                <div className="space-y-1">
                  <dd className="text-xl font-bold">{t}</dd>
                  <dd className="text-[15px] leading-relaxed text-navy-800">{d}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
