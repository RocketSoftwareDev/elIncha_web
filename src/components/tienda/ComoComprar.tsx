import { formatoPrecio } from '@/lib/domain/pricing'
import type { Ajustes, Combo, TipoPrenda } from '@/lib/domain/types'

const TITULOS = ['Arma tu carrito', 'Envíalo por WhatsApp', 'Reserva con $5', 'Llega en 20 – 30 días']

export function ComoComprar({ ajustes, tipos, combos }: { ajustes: Ajustes; tipos: TipoPrenda[]; combos: Combo[] }) {
  const nombreTipo = (id: string) => tipos.find(t => t.id === id)?.nombre ?? ''
  const titulos = TITULOS.map(t => t.replace('$5', formatoPrecio(ajustes.montoReserva)))

  return (
    <section id="como-comprar" className="scroll-mt-24 bg-white px-4 py-20 text-navy-950 md:px-[72px] md:py-[104px]">
      <div className="mx-auto flex max-w-[1296px] flex-col gap-14 lg:flex-row lg:gap-16">
        <div className="flex-1 space-y-9">
          <p className="kicker text-navy-700">04 — Cómo comprar</p>
          <h2 className="display text-[clamp(52px,6vw,72px)] leading-[0.95]">Bajo pedido,<br />sin complicarte.</h2>
          <ol>
            {ajustes.pasosComoComprar.map((d, i) => (
              <li key={i} className="flex gap-7 border-t border-navy-950/12 py-[22px]">
                <span className="display text-[44px] leading-none text-sky">{String(i + 1).padStart(2, '0')}</span>
                <div className="space-y-1.5">
                  <p className="text-xl font-bold">{titulos[i] ?? `Paso ${i + 1}`}</p>
                  <p className="text-[15px] leading-relaxed text-ink-soft">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-5 bg-navy-950 p-7 text-white md:p-9 lg:w-[520px]">
          <div className="flex items-end justify-between">
            <h3 className="display text-[44px]">Precios</h3>
            <p className="kicker text-[11px] text-sky">Todo incluido</p>
          </div>
          <ul>
            {tipos.map(t => (
              <li key={t.id} className="flex items-center justify-between border-b border-line py-3">
                <span>{t.nombre}</span>
                <span className="display text-[26px]">{formatoPrecio(t.precio)}</span>
              </li>
            ))}
          </ul>
          {combos.map(c => (
            <div key={c.id} className="flex items-center justify-between bg-sky px-[18px] py-4 text-navy-950">
              <div>
                <p className="kicker text-[10px] font-bold text-navy-800">Combo {c.nombre}</p>
                <p className="font-bold">{c.tipos.map(nombreTipo).join(' + ')}</p>
              </div>
              <span className="display text-[40px]">{formatoPrecio(c.precio)}</span>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1 border border-line p-3.5">
              <p className="text-[13px] text-muted">Nombre y número</p>
              <p className="display text-2xl">Gratis</p>
            </div>
            <div className="space-y-1 border border-line p-3.5">
              <p className="text-[13px] text-muted">Parches</p>
              <p className="display text-2xl">+$1 c/u</p>
            </div>
          </div>
          <p className="text-[13px] leading-relaxed text-muted">
            Nombre de hasta 10 caracteres: Ñ, tildes y apóstrofe incluidos. Parches: Champions, Libertadores, Mundial y más.
          </p>
          <div className="border-t border-line pt-4 text-[13px] leading-relaxed text-muted">
            <p className="kicker mb-1.5 text-[10px] text-sky">¿Cómo pago?</p>
            {ajustes.metodosPago.filter(m => m.activo).map(m => m.nombre).join(' o ')}. Reservas con {formatoPrecio(ajustes.montoReserva)} y el resto lo coordinamos por WhatsApp.
          </div>
        </div>
      </div>
    </section>
  )
}
