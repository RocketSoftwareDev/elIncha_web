import type { Metadata } from 'next'
import { RotateCcw } from 'lucide-react'
import { Sidebar } from '@/components/admin/Sidebar'
import { reiniciarAccion } from '../acciones'

// Los datos cambian con cada acción del admin: nada se pre-renderiza.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: { default: 'Admin', template: '%s · Admin El Hincha' }, robots: { index: false } }

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-admin-bg text-navy-950 lg:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <form action={reiniciarAccion} className="flex flex-wrap items-center justify-between gap-2 bg-amber-100 px-6 py-2 text-amber-900 lg:px-10">
          <p className="kicker text-[11px]">Modo de prueba · datos en memoria, se reinician al reiniciar el servidor</p>
          <button type="submit" className="inline-flex items-center gap-1.5 text-xs font-semibold underline-offset-2 hover:underline">
            <RotateCcw size={13} aria-hidden /> Reiniciar datos
          </button>
        </form>
        <main className="space-y-5 px-6 py-7 lg:px-10">{children}</main>
      </div>
    </div>
  )
}
