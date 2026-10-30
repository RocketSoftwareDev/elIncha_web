'use server'

import { createHash } from 'node:crypto'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { hashValido, verificarClave } from '@/lib/auth/clave'
import { authConfigurada, cerrarSesion, iniciarSesion } from '@/lib/auth/sesion'
import { repo } from '@/lib/data/repo'
import { ipCliente } from '@/lib/ip'

/** 5 intentos fallidos cada 15 minutos por conexión. */
const MAX_FALLOS = 5
const VENTANA = 15 * 60 * 1000

export type EstadoLogin = { error?: string } | null

export async function ingresarAccion(_: EstadoLogin, f: FormData): Promise<EstadoLogin> {
  if (!authConfigurada()) return { error: 'El acceso no está configurado (falta ADMIN_PASSWORD_HASH o SESSION_SECRET).' }
  if (!hashValido(process.env.ADMIN_PASSWORD_HASH!)) {
    console.error('[login] ADMIN_PASSWORD_HASH tiene un formato inválido (¿se copió incompleto o se perdieron los «$»?)')
    return { error: 'La clave cifrada (ADMIN_PASSWORD_HASH) está mal copiada. Genérala de nuevo con «pnpm clave-admin» y pégala completa.' }
  }

  const ip = ipCliente(await headers())
  const clave = `login:${createHash('sha256').update(ip).digest('hex').slice(0, 16)}`
  if ((await repo.contarIntentos(clave, Date.now() - VENTANA)) >= MAX_FALLOS) {
    return { error: 'Demasiados intentos. Espera 15 minutos.' }
  }

  const contrasena = String(f.get('clave') ?? '').slice(0, 200)
  if (!contrasena || !verificarClave(contrasena, process.env.ADMIN_PASSWORD_HASH!)) {
    await repo.registrarIntento(clave)
    // Pausa breve: hace más lento probar contraseñas en serie.
    await new Promise(r => setTimeout(r, 800))
    return { error: 'Contraseña incorrecta' }
  }

  await iniciarSesion()
  redirect('/admin/resumen')
}

export async function salirAccion() {
  await cerrarSesion()
  redirect('/admin/login')
}
