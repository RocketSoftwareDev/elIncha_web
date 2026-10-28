import Link from 'next/link'
import { FacebookLogo, InstagramLogo, TiktokLogo, WhatsappLogo } from '@phosphor-icons/react/dist/ssr'
import { Logo } from '@/components/brand/Logo'
import type { Ajustes } from '@/lib/domain/types'
import { enlaceWhatsapp } from '@/lib/domain/whatsapp'

const usuario = (h: string) => h.replace(/^@/, '')

export function Footer({ ajustes }: { ajustes: Ajustes }) {
  const redes = [
    { label: 'Instagram', href: `https://instagram.com/${usuario(ajustes.redes.instagram)}`, Icono: InstagramLogo },
    { label: 'TikTok', href: `https://tiktok.com/@${usuario(ajustes.redes.tiktok)}`, Icono: TiktokLogo },
    { label: 'Facebook', href: `https://facebook.com/search/top?q=${encodeURIComponent(ajustes.redes.facebook)}`, Icono: FacebookLogo },
    { label: 'WhatsApp', href: enlaceWhatsapp(ajustes.whatsapp, '¡Hola El Hincha!'), Icono: WhatsappLogo },
  ]
  const columnas = [
    { titulo: 'Tienda', links: [['La vitrina', '/#vitrina'], ['Tu dorsal', '/#vitrina'], ['El drop', '/#drop'], ['Precios', '/#como-comprar']] },
    { titulo: 'Ayuda', links: [['Cómo comprar', '/#como-comprar'], ['Guía de tallas', '/#como-comprar'], ['Envíos en El Oro', '/#como-comprar'], ['Escríbenos', redes[3].href]] },
  ]

  return (
    <footer className="bg-navy-950 px-4 pb-10 pt-16 md:px-[72px] md:pt-20">
      <div className="mx-auto max-w-[1296px]">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_auto]">
          <div className="space-y-5">
            <Logo alto={128} className="h-32 w-auto" />
            <p className="text-[15px] leading-relaxed text-muted">
              Camisetas de fútbol con tu nombre.
              <br />
              Hecho por hinchas, en Machala – Ecuador.
            </p>
          </div>
          {columnas.map(c => (
            <div key={c.titulo} className="space-y-3.5">
              <p className="kicker text-sky">{c.titulo}</p>
              {c.links.map(([label, href]) => (
                <Link key={label} href={href} className="block text-[15px] hover:text-sky">{label}</Link>
              ))}
            </div>
          ))}
          <div className="space-y-4">
            <p className="kicker text-sky">Síguenos</p>
            <div className="flex gap-2.5">
              {redes.map(({ label, href, Icono }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid size-12 place-items-center rounded-full border border-line transition hover:border-sky hover:text-sky">
                  <Icono size={22} aria-hidden />
                </a>
              ))}
            </div>
            <p className="font-mono text-sm">{ajustes.redes.instagram}</p>
          </div>
        </div>
        <p className="display mt-14 select-none text-[clamp(56px,10vw,150px)] text-sky/15" aria-hidden>El Hincha · Machala</p>
        <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-line pt-5 font-mono text-[11px] tracking-[0.16em] text-muted">
          <span>© {new Date().getFullYear()} EL HINCHA · MACHALA, EL ORO, EC</span>
          <span>ELHINCHAMACHALA.COM</span>
        </div>
      </div>
    </footer>
  )
}
