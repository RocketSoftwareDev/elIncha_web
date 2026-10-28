'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import type { Resultado } from '@/app/admin/acciones'
import { Aviso } from './ui'

type Accion = (previo: Resultado, datos: FormData) => Promise<Resultado>

/** Formulario que muestra el resultado de la acción (ok o error) sin recargar. */
export function FormAccion({ accion, children, className, id }: { accion: Accion; children: React.ReactNode; className?: string; id?: string }) {
  const [estado, enviar] = useActionState(accion, null)
  return (
    <form id={id} action={enviar} className={className}>
      {children}
      {estado?.error && <Aviso tipo="error">{estado.error}</Aviso>}
      {estado?.ok && <Aviso tipo="ok">{estado.ok}</Aviso>}
    </form>
  )
}

export function BotonEnviar({ children, className }: { children: React.ReactNode; className: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? 'Guardando…' : children}
    </button>
  )
}
