import Image from 'next/image'
import { ArrowDownRight, MoveRight } from 'lucide-react'
import { WhatsappLogo } from '@phosphor-icons/react/dist/ssr'
import { enlaceWhatsapp } from '@/lib/domain/whatsapp'

export function Portada({ whatsapp }: { whatsapp: string }) {
  return (
    <section className="relative isolate overflow-hidden px-4 pb-16 md:px-[72px] md:pb-[72px]">
      <Image src="/mock/hero-estadio.jpg" alt="" fill priority sizes="100vw" className="-z-20 object-cover opacity-45" />
      <div className="absolute inset-0 -z-10 bg-navy-900/60" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-navy-950/40 to-navy-950" />

      <div className="mx-auto max-w-[1296px]">
        <div className="flex justify-between gap-4 border-b border-line py-[18px] font-mono text-[11px] tracking-[0.16em] text-muted md:text-xs">
          <span>MACHALA · EL ORO · ECUADOR</span>
          <span className="hidden md:inline">CLUBES · SELECCIONES · RETRO · MUSCULERAS</span>
        </div>

        <div className="flex flex-col gap-12 pt-10 md:flex-row md:items-end md:gap-12 md:pt-14">
          <div className="flex-1 space-y-7">
            <h1 className="display text-[clamp(88px,15vw,200px)] leading-[0.88]">
              La de tu
              <br />
              <span className="text-sky">equipo.</span>
            </h1>
            <p className="max-w-[520px] text-base leading-relaxed text-[#d6def0] md:text-lg">
              Camisetas de clubes, selecciones y retro, con tu nombre y tu número en la espalda. Arma tu pedido aquí, lo mandas por WhatsApp y te la entregamos en Machala.
            </p>
            <div className="flex flex-wrap gap-3.5">
              <a href="#vitrina" className="kicker flex items-center gap-2.5 bg-sky px-7 py-[18px] text-sm font-bold text-navy-950">
                Ver la vitrina <ArrowDownRight size={18} aria-hidden />
              </a>
              <a href={enlaceWhatsapp(whatsapp, '¡Hola El Hincha! Quiero hacer un pedido.')} target="_blank" rel="noopener noreferrer" className="kicker flex items-center gap-2.5 border border-white px-7 py-[18px] text-sm font-bold">
                <WhatsappLogo size={18} weight="fill" aria-hidden /> Pedir por WhatsApp
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[470px] pt-10">
            <div className="relative aspect-[440/560] w-[94%] border border-sky bg-navy-800">
              <Image src="/mock/hero-hincha.png" alt="Hincha mostrando el 10 en la espalda de su camiseta" fill sizes="440px" className="object-cover" />
            </div>
            <div className="absolute right-0 top-0 flex size-[110px] -rotate-[8deg] flex-col items-center justify-center rounded-full border-[3px] border-navy-950 bg-sky text-navy-950 md:size-[130px]">
              <span className="font-mono text-[10px] font-bold tracking-[0.2em]">DESDE LA</span>
              <span className="display text-[28px]">Tribuna</span>
              <span className="font-mono text-[10px] font-bold tracking-[0.2em]">MACHALA · EC</span>
            </div>
            <p className="absolute -left-2 bottom-24 hidden rotate-6 items-center gap-2 font-script text-3xl text-sky lg:-left-52 lg:flex">
              ¡ese eres tú! <MoveRight size={40} aria-hidden />
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Ticker() {
  const palabras = ['Clubes', '★', 'Selecciones', '★', 'Retro', '★', 'Tu nombre, tu número', '★']
  const fila = [...palabras, ...palabras, ...palabras]
  return (
    <div className="overflow-hidden bg-sky py-4 text-navy-950" aria-hidden>
      <div className="animate-marquee flex w-max gap-10">
        {[...fila, ...fila].map((p, i) => <span key={i} className="display text-3xl">{p}</span>)}
      </div>
    </div>
  )
}
