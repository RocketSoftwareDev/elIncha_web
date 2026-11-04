import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { WhatsappLogo } from '@phosphor-icons/react/dist/ssr'
import { BloquesSoporte } from '@/components/BloquesSoporte'
import { ajustesPublicos, soportePublico } from '@/lib/data/tienda'
import { enlaceWhatsapp } from '@/lib/domain/whatsapp'

export const metadata: Metadata = {
  title: 'Soporte',
  description: 'Cómo comprar, guía de tallas, envíos en El Oro, cambios y cuidado de tu camiseta.',
}

/** Lo escribe el admin (Admin → Soporte). Sin secciones publicadas, la página no existe. */
export default async function Soporte() {
  const [secciones, ajustes] = await Promise.all([soportePublico(), ajustesPublicos()])
  if (secciones.length === 0) notFound()

  return (
    <div className="px-4 pb-24 md:px-[72px]">
      <div className="mx-auto max-w-[1296px]">
        <header className="space-y-4 border-b border-line py-10 md:py-14">
          <p className="kicker text-muted"><Link href="/" className="hover:text-white">Inicio</Link> / Soporte</p>
          <h1 className="display text-[clamp(56px,7vw,88px)] leading-[0.95]">Soporte</h1>
          <p className="max-w-xl text-muted">Todo lo que necesitas antes y después de tu pedido. ¿No encuentras algo? Escríbenos.</p>
        </header>

        <div className="flex flex-col gap-10 pt-10 lg:flex-row lg:gap-16">
          <nav aria-label="Secciones de soporte" className="lg:sticky lg:top-32 lg:w-64 lg:self-start">
            <ul className="no-scrollbar flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
              {secciones.map(s => (
                <li key={s.id} className="shrink-0">
                  <a href={`#${s.id}`} className="kicker block border border-line px-3.5 py-2.5 text-[12px] font-bold transition hover:border-sky hover:text-sky lg:border-0 lg:border-l-2 lg:px-4">
                    {s.titulo}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 flex-1 space-y-14">
            {secciones.map(s => (
              <section key={s.id} id={s.id} aria-labelledby={`t-${s.id}`} className="scroll-mt-32 space-y-5">
                <h2 id={`t-${s.id}`} className="display text-[clamp(36px,4vw,52px)] leading-none">{s.titulo}</h2>
                <BloquesSoporte contenido={s.contenido} />
              </section>
            ))}

            <div className="flex flex-col items-start gap-4 border border-sky bg-navy-900 p-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-bold">¿Te quedó alguna duda?</p>
                <p className="text-sm text-muted">Te respondemos por WhatsApp · {ajustes.horario}</p>
              </div>
              <a href={enlaceWhatsapp(ajustes.whatsapp, '¡Hola El Hincha! Tengo una consulta.')} target="_blank" rel="noopener noreferrer"
                className="kicker flex items-center gap-2 bg-whatsapp px-5 py-3.5 text-sm font-bold text-navy-950">
                <WhatsappLogo size={18} weight="fill" aria-hidden /> Escríbenos
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
