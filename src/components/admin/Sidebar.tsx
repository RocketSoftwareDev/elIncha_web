import { listarDrops, resumenDrop } from '@/lib/data/admin'
import { formatoPrecio } from '@/lib/domain/pricing'
import { restante } from '@/lib/domain/drop'
import { CuentaRegresiva } from './CuentaRegresiva'
import { ahora as horaDelServidor } from '@/lib/reloj'
import { diaMesCorto } from './fechas'
import { NavLinks } from './NavLinks'

async function TarjetaDrop() {
  const drop = (await listarDrops()).find(d => d.estado === 'abierto')
  if (!drop) {
    return (
      <div className="rounded-xl border border-white/15 bg-navy-900 p-4">
        <p className="kicker flex items-center gap-2 text-[10px] text-red-300">
          <span className="h-2 w-2 rounded-full bg-red-400" /> Sin drop activo
        </p>
        <p className="mt-2 text-xs text-muted">La tienda muestra «Ningún drop disponible» y el carrito está pausado.</p>
      </div>
    )
  }

  const ahora = horaDelServidor()
  const inicio = new Date(drop.abreEn).getTime()
  const fin = new Date(drop.cierraEn).getTime()
  const avance = Math.min(100, Math.max(0, ((ahora - inicio) / (fin - inicio)) * 100))
  const { dias } = restante(drop.cierraEn, ahora)
  const r = await resumenDrop(drop.id)

  return (
    <div className="space-y-2.5 rounded-xl border border-sky bg-navy-800 p-4">
      <div className="flex items-center justify-between">
        <p className="kicker text-[10px] text-sky">Drop activo</p>
        <p className="flex items-center gap-1.5 text-[11px] text-whatsapp">
          <span className="h-2 w-2 rounded-full bg-whatsapp" /> Abierto
        </p>
      </div>
      <p className="display text-[22px] text-white">{drop.nombre}</p>
      <p className="text-xs text-[#d6def0]">
        Cierra el {diaMesCorto(drop.cierraEn).toLowerCase()} · faltan {dias} {dias === 1 ? 'día' : 'días'} ·{' '}
        <CuentaRegresiva cierraEn={drop.cierraEn} ahoraServidor={ahora} />
      </p>
      <div className="h-1.5 rounded-full bg-white/10" aria-hidden>
        <div className="h-1.5 rounded-full bg-sky" style={{ width: `${avance}%` }} />
      </div>
      <p className="text-xs font-semibold text-white">
        {r.pedidos} pedidos · {formatoPrecio(r.vendido)}
      </p>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="flex flex-col gap-5 bg-navy-950 px-5 py-4 lg:sticky lg:top-0 lg:h-dvh lg:w-[260px] lg:shrink-0 lg:gap-8 lg:py-7">
      <div className="flex items-center gap-3 px-2">
        <span className="display flex h-9 w-9 items-center justify-center rounded-lg bg-sky text-base text-navy-950">EH</span>
        <span className="flex flex-col leading-tight">
          <span className="text-base font-bold text-white">El Hincha</span>
          <span className="kicker text-[10px] text-sky">Admin</span>
        </span>
      </div>
      <div className="lg:flex-1">
        <NavLinks />
      </div>
      <div className="hidden lg:block">
        <TarjetaDrop />
      </div>
    </aside>
  )
}
