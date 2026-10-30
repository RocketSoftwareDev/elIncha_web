import type { Metadata } from 'next'
import { LogOut, RotateCcw } from 'lucide-react'
import { Sidebar } from '@/components/admin/Sidebar'
import { adminAbiertoEnPrueba, requerirAdmin } from '@/lib/auth/sesion'
import { modoPrueba } from '@/lib/data/admin'
import { reiniciarAccion } from '../acciones'
import { salirAccion } from '../login/acciones'

// Los datos cambian con cada acción del admin: nada se pre-renderiza.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: { default: 'Admin', template: '%s · Admin El Hincha' }, robots: { index: false } }

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requerirAdmin()
  const prueba = modoPrueba()
  return (
    <div className="min-h-dvh bg-admin-bg text-navy-950 lg:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        {prueba && (
          <form action={reiniciarAccion} className="flex flex-wrap items-center justify-between gap-2 bg-amber-100 px-6 py-2 text-amber-900 lg:px-10">
            <p className="kicker text-[11px]">Modo de prueba · datos en memoria, se reinician al reiniciar el servidor</p>
            <button type="submit" className="inline-flex items-center gap-1.5 text-xs font-semibold underline-offset-2 hover:underline">
              <RotateCcw size={13} aria-hidden /> Reiniciar datos
            </button>
          </form>
        )}
        {!adminAbiertoEnPrueba() && (
          <form action={salirAccion} className="flex justify-end px-6 pt-4 lg:px-10">
            <button type="submit" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-navy-950">
              <LogOut size={14} aria-hidden /> Salir
            </button>
          </form>
        )}
        <main className="space-y-5 px-6 py-7 lg:px-10">{children}</main>
      </div>
    </div>
  )
}
