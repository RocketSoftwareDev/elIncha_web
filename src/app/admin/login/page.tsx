import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/brand/Logo'
import { authConfigurada, sesionValida } from '@/lib/auth/sesion'
import { FormLogin } from './FormLogin'

export const metadata: Metadata = { title: { absolute: 'Ingresar · Admin El Hincha' }, robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function Login() {
  if (await sesionValida()) redirect('/admin/resumen')
  return (
    <main className="flex min-h-dvh items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Logo alto={96} />
          <p className="kicker text-sky">Panel de administración</p>
        </div>
        <FormLogin configurado={authConfigurada()} />
      </div>
    </main>
  )
}
