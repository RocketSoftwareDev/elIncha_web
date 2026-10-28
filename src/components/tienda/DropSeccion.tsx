import Link from 'next/link'
import { WhatsappLogo } from '@phosphor-icons/react/dist/ssr'
import { fechaCorta, llegada, resumenDrop } from '@/lib/domain/drop'
import type { Drop } from '@/lib/domain/types'
import { enlaceWhatsapp } from '@/lib/domain/whatsapp'
import { CuentaRegresiva } from './CuentaRegresiva'

/** Drop abierto: cuenta regresiva y calendario. Sin drop: 00:00:00 y «pronto otro drop». */
export function DropSeccion({ drop, abierto, ahora, whatsapp }: { drop: Drop | null; abierto: boolean; ahora: number; whatsapp: string }) {
  return (
    <section id="drop" className="relative isolate scroll-mt-24 overflow-hidden bg-navy-900 px-4 py-20 md:px-[72px] md:py-24">
      <div className="absolute inset-0 -z-10 bg-[url('/mock/drop-fondo.jpg')] bg-cover bg-center opacity-20" />
      <div className="absolute inset-0 -z-10 bg-navy-900/70" />
      <div className="mx-auto max-w-[1296px] space-y-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="space-y-2.5">
            {abierto ? (
              <p className="kicker text-sky">03 — Drop abierto</p>
            ) : (
              <p className="kicker flex items-center gap-2 text-red-400"><span className="size-2 rounded-full bg-red-400" />03 — Sin drop activo</p>
            )}
            <h2 className="display text-5xl md:text-[64px]">{abierto ? `${drop!.nombre} · cierra en` : 'Ningún drop disponible'}</h2>
          </div>
          <p className="max-w-[420px] leading-relaxed text-muted">
            {abierto
              ? `Pide hasta el ${resumenDrop(drop!).pideHasta}. Cerramos, mandamos el lote y tu camiseta llega entre el ${resumenDrop(drop!).llegaEntre}.`
              : 'Pronto realizaremos otro drop. Mientras tanto puedes mirar la vitrina y te avisamos apenas abra.'}
          </p>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <CuentaRegresiva cierraEn={abierto && drop!.mostrarCuentaRegresiva ? drop!.cierraEn : null} ahoraServidor={ahora} />
          {abierto ? (
            <Link href="/vitrina" className="flex min-h-40 flex-col justify-between bg-whatsapp p-7 text-navy-950 lg:w-[300px]">
              <WhatsappLogo size={40} weight="fill" aria-hidden />
              <span className="display text-4xl leading-none">Armar mi<br />pedido →</span>
            </Link>
          ) : (
            <a href={enlaceWhatsapp(whatsapp, '¡Hola El Hincha! Avísenme cuando abra el próximo drop.')} target="_blank" rel="noopener noreferrer" className="flex min-h-40 flex-col justify-between border-2 border-whatsapp p-7 text-whatsapp lg:w-[300px]">
              <WhatsappLogo size={40} weight="fill" aria-hidden />
              <span className="display text-4xl leading-none">Avísame del<br />próximo drop →</span>
            </a>
          )}
        </div>

        {abierto && <Calendario drop={drop!} />}
      </div>
    </section>
  )
}

function Calendario({ drop }: { drop: Drop }) {
  const { desde, hasta } = llegada(drop)
  const pasos = [
    [`${fechaCorta(drop.abreEn)} – ${fechaCorta(drop.cierraEn)}`, 'Recibimos pedidos'],
    [fechaCorta(drop.envioEn), 'Enviamos el lote'],
    [`${fechaCorta(desde.toISOString())} – ${fechaCorta(hasta.toISOString())}`, 'Llega a Machala'],
    ['Después', 'Sin drop abierto, el carrito se pausa'],
  ]
  return (
    <ol className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2 lg:flex lg:justify-between">
      {pasos.map(([f, t]) => (
        <li key={t} className="flex items-center gap-2.5">
          <span className="kicker font-bold text-sky">{f}</span>
          <span className="text-[15px] text-[#d6def0]">{t}</span>
        </li>
      ))}
    </ol>
  )
}
