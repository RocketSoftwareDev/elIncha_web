import type { Metadata } from 'next'
import { Lock } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'

export const metadata: Metadata = { title: 'Ingresar · Admin El Hincha', robots: { index: false } }

// Solo la interfaz. El acceso real (contraseña cifrada y sesión) lo da el back.
export default function Login() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Logo alto={96} />
          <p className="kicker text-sky">Panel de administración</p>
        </div>
        <form className="space-y-4 rounded-2xl bg-white p-6 text-navy-950">
          <h1 className="display text-3xl">Ingresar</h1>
          <label className="flex flex-col gap-1.5">
            <span className="kicker text-[10px] text-ink-soft">Correo</span>
            <input type="email" name="email" autoComplete="username" disabled className="rounded-lg border border-line-dark bg-admin-bg px-3 py-2.5 text-sm" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="kicker text-[10px] text-ink-soft">Contraseña</span>
            <input type="password" name="password" autoComplete="current-password" disabled className="rounded-lg border border-line-dark bg-admin-bg px-3 py-2.5 text-sm" />
          </label>
          <button type="submit" disabled className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy-950 py-3 text-sm font-semibold text-white opacity-50">
            <Lock size={15} aria-hidden /> Ingresar
          </button>
          <p className="rounded-lg bg-amber-100 px-3 py-2.5 text-xs text-amber-900">El acceso se activa cuando se conecte el back.</p>
        </form>
      </div>
    </main>
  )
}
