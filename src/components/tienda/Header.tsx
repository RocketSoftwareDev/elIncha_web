import Link from 'next/link'
import { WhatsappLogo } from '@phosphor-icons/react/dist/ssr'
import { Logo } from '@/components/brand/Logo'
import { enlaceWhatsapp } from '@/lib/domain/whatsapp'
import { BotonCarrito } from './BotonCarrito'

const LINKS = [
  { href: '/#vitrina', label: 'La vitrina' },
  { href: '/#drop', label: 'El drop' },
  { href: '/#como-comprar', label: 'Cómo comprar' },
  { href: '/#nosotros', label: 'Nosotros' },
]

export function Header({ whatsapp }: { whatsapp: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-navy-950/90 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-[1440px] items-center justify-between gap-6 px-4 md:h-24 md:px-[72px]">
        <Link href="/" aria-label="El Hincha, inicio">
          <Logo alto={64} className="h-14 w-auto md:h-16" />
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-9 lg:flex">
          {LINKS.map(l => (
            <Link key={l.href} href={l.href} className="kicker font-bold text-white/90 transition hover:text-sky">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <BotonCarrito />
          <a
            href={enlaceWhatsapp(whatsapp, '¡Hola El Hincha! Tengo una consulta.')}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-full border border-sky bg-navy-800 px-4 py-2.5 text-sm font-semibold transition hover:bg-navy-700 sm:flex"
          >
            <WhatsappLogo size={18} weight="fill" aria-hidden />
            Escríbenos
          </a>
        </div>
      </div>
    </header>
  )
}
