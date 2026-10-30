import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Liga } from '@/lib/domain/types'

/** Inicio: solo las ligas. Cada círculo entra a /vitrina con esa liga ya filtrada. */
export function LigasGancho({ ligas, conteo, total }: { ligas: Liga[]; conteo: Map<string, number>; total: number }) {
  return (
    <section id="ligas" className="scroll-mt-24 bg-navy-950 px-4 pb-20 pt-14 md:px-[72px] md:pb-[88px] md:pt-[72px]">
      <div className="mx-auto flex max-w-[1296px] flex-col items-center gap-12">
        <div className="space-y-3 text-center">
          <p className="kicker text-sky">01 — La vitrina</p>
          <h2 className="display text-[clamp(52px,7vw,88px)] leading-none">¿De qué liga eres?</h2>
          <p className="text-[17px] text-muted">Tenemos {total} camisetas en {ligas.length} ligas. Elige la tuya y entra a la vitrina.</p>
        </div>

        <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-4">
          {ligas.map(l => {
            const n = conteo.get(l.slug) ?? 0
            return (
              <li key={l.id}>
                <Link href={`/vitrina?liga=${l.slug}`} className="group flex flex-col items-center gap-3.5">
                  <span className="relative size-32 overflow-hidden rounded-full ring-1 ring-line transition group-hover:ring-4 group-hover:ring-sky md:size-[168px]">
                    {l.foto
                      ? <Image src={l.foto} alt="" fill sizes="168px" className="object-cover transition duration-300 group-hover:scale-105" />
                      : <span className="display grid size-full place-items-center bg-navy-800 text-5xl text-sky md:text-6xl" aria-hidden>{l.nombre.slice(0, 1)}</span>}
                    <span className="kicker absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 bg-sky px-2.5 py-1.5 text-[10px] font-bold text-navy-950 opacity-0 transition group-hover:opacity-100">
                      Entrar <ArrowRight size={12} aria-hidden />
                    </span>
                  </span>
                  <span className="kicker text-center text-[11px] font-bold transition group-hover:text-sky md:text-[13px]">{l.nombre}</span>
                  <span className="-mt-2 text-[13px] text-muted">{n === 0 ? 'Próximamente' : `${n} ${n === 1 ? 'camiseta' : 'camisetas'}`}</span>
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Link href="/vitrina" className="kicker flex items-center gap-3 bg-sky px-9 py-[22px] text-[15px] font-bold text-navy-950">
            Entrar a la vitrina <ArrowRight size={20} aria-hidden />
          </Link>
          <Link href="/vitrina#buscar" className="text-[15px] text-muted underline hover:text-white">o busca tu equipo directo</Link>
        </div>
      </div>
    </section>
  )
}
