// Piezas visuales del admin. Sin estado: sirven en componentes de servidor.

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line-dark bg-white ${className}`}>{children}</section>
}

export function CardHeader({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line-dark px-5 py-4">
      <div>
        <h2 className="text-base font-bold text-navy-950">{titulo}</h2>
        {subtitulo && <p className="text-xs text-ink-soft">{subtitulo}</p>}
      </div>
      {children}
    </div>
  )
}

export function PageHeader({ titulo, subtitulo, children }: { titulo: string; subtitulo: string; children?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="space-y-1">
        <h1 className="display text-[40px] text-navy-950">{titulo}</h1>
        <p className="text-sm text-ink-soft">{subtitulo}</p>
      </div>
      {children && <div className="flex flex-wrap gap-2.5">{children}</div>}
    </header>
  )
}

export function Chip({ clase, children }: { clase: string; children: React.ReactNode }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${clase}`}>{children}</span>
}

export const boton = {
  oscuro: 'inline-flex items-center justify-center gap-2 rounded-lg bg-navy-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50',
  claro: 'inline-flex items-center justify-center gap-2 rounded-lg border border-navy-950/15 bg-white px-4 py-2.5 text-sm font-semibold text-navy-950 hover:bg-admin-bg disabled:opacity-50',
  peligro: 'inline-flex items-center justify-center gap-2 rounded-lg border border-red-700 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50',
  whatsapp: 'inline-flex items-center justify-center gap-2 rounded-lg bg-whatsapp px-4 py-2.5 text-sm font-semibold text-navy-950 hover:brightness-95',
}

export const input =
  'w-full rounded-lg border border-line-dark bg-admin-bg px-3 py-2.5 text-sm text-navy-950 outline-none focus:border-navy-700 focus:bg-white'

export function Campo({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="kicker text-[10px] text-ink-soft">{label}</span>
      {children}
    </label>
  )
}

/** Interruptor basado en un checkbox real: funciona dentro de formularios sin JS. */
export function Interruptor({ name, defaultChecked, label, ayuda }: { name: string; defaultChecked: boolean; label: string; ayuda?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="flex flex-col">
        <span className="text-sm font-semibold text-navy-950">{label}</span>
        {ayuda && <span className="text-xs text-ink-soft">{ayuda}</span>}
      </span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="relative h-[22px] w-10 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-navy-950 peer-focus-visible:ring-2 peer-focus-visible:ring-sky after:absolute after:left-[3px] after:top-[3px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-[18px] peer-checked:after:bg-sky" />
    </label>
  )
}

export function Aviso({ tipo = 'info', children }: { tipo?: 'info' | 'alerta' | 'error' | 'ok'; children: React.ReactNode }) {
  const clase = {
    info: 'bg-sky-soft text-navy-800',
    alerta: 'bg-amber-100 text-amber-800',
    error: 'bg-red-50 text-red-700',
    ok: 'bg-green-50 text-green-800',
  }[tipo]
  return <p className={`rounded-lg px-3 py-2.5 text-xs leading-relaxed ${clase}`}>{children}</p>
}
