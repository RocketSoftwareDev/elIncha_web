'use client'

import { Lock } from 'lucide-react'
import { useActionState } from 'react'
import { ingresarAccion, type EstadoLogin } from './acciones'

export function FormLogin({ configurado }: { configurado: boolean }) {
  const [estado, accion, pendiente] = useActionState<EstadoLogin, FormData>(ingresarAccion, null)
  return (
    <form action={accion} className="space-y-4 rounded-2xl bg-white p-6 text-navy-950">
      <h1 className="display text-3xl">Ingresar</h1>
      <label className="flex flex-col gap-1.5">
        <span className="kicker text-[10px] text-ink-soft">Contraseña</span>
        <input
          type="password"
          name="clave"
          required
          autoComplete="current-password"
          disabled={!configurado}
          className="rounded-lg border border-line-dark bg-admin-bg px-3 py-2.5 text-sm outline-none focus:border-navy-700"
        />
      </label>
      {estado?.error && <p role="alert" className="rounded-lg bg-red-100 px-3 py-2.5 text-xs text-red-800">{estado.error}</p>}
      {!configurado && (
        <p className="rounded-lg bg-amber-100 px-3 py-2.5 text-xs text-amber-900">
          Falta configurar ADMIN_PASSWORD_HASH y SESSION_SECRET en Netlify.
        </p>
      )}
      <button type="submit" disabled={!configurado || pendiente} className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy-950 py-3 text-sm font-semibold text-white disabled:opacity-50">
        <Lock size={15} aria-hidden /> {pendiente ? 'Verificando…' : 'Ingresar'}
      </button>
    </form>
  )
}
