'use client'

import { LayoutDashboard, MessageCircle, Settings, Shirt, Sparkles, Tag, Timer, Trophy, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const GRUPOS: { titulo: string; items: { href: string; label: string; icono: LucideIcon }[] }[] = [
  {
    titulo: 'Operación',
    items: [
      { href: '/admin/resumen', label: 'Resumen', icono: LayoutDashboard },
      { href: '/admin/drops', label: 'Drops', icono: Timer },
      { href: '/admin/pedidos', label: 'Pedidos', icono: MessageCircle },
    ],
  },
  {
    titulo: 'Catálogo',
    items: [
      { href: '/admin/productos', label: 'Productos', icono: Shirt },
      { href: '/admin/ligas', label: 'Ligas y equipos', icono: Trophy },
      { href: '/admin/precios', label: 'Precios y combos', icono: Tag },
      { href: '/admin/precios#personalizacion', label: 'Personalización', icono: Sparkles },
    ],
  },
  { titulo: 'Tienda', items: [{ href: '/admin/ajustes', label: 'Ajustes y pagos', icono: Settings }] },
]

export function NavLinks() {
  const ruta = usePathname()
  return (
    <nav aria-label="Admin" className="flex gap-5 overflow-x-auto no-scrollbar lg:flex-col lg:overflow-visible">
      {GRUPOS.map(g => (
        <div key={g.titulo} className="flex shrink-0 gap-0.5 lg:flex-col">
          <p className="kicker hidden px-3 pb-1 text-[10px] text-[#5b6b95] lg:block">{g.titulo}</p>
          {g.items.map(({ href, label, icono: Icono }) => {
            const activo = !href.includes('#') && (ruta === href || ruta.startsWith(`${href}/`))
            return (
              <Link
                key={href}
                href={href}
                aria-current={activo ? 'page' : undefined}
                className={`flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm transition ${
                  activo ? 'bg-navy-800 font-semibold text-white' : 'text-muted hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icono size={18} className={activo ? 'text-sky' : ''} aria-hidden />
                {label}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
