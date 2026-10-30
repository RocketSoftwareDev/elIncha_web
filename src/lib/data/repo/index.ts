import 'server-only'

import { cache } from 'react'
import { repoMemoria } from './memoria'
import { repoSupabase } from './supabase'
import type { Repo } from './tipos'

export { ErrorNegocio } from './tipos'
export type { DatosCatalogo, EventoGuardado } from './tipos'

const configurado = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)

/**
 * En Netlify (producción) los datos de prueba están prohibidos salvo MODO_PRUEBA=1:
 * si faltara la configuración, los pedidos de clientes reales se perderían en memoria.
 * Mejor fallar a la vista que perder pedidos en silencio.
 */
const sinConfigurar: Repo = new Proxy(repoMemoria, {
  get(objetivo, prop) {
    if (prop === 'modo') return objetivo.modo
    throw new Error('Supabase no está configurado: define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Netlify.')
  },
})

/** Con Supabase configurado se usa Supabase; en local, datos de prueba. */
// EH_EN_NETLIFY se fija al compilar (next.config.ts): NETLIFY solo existe durante el build.
export const repo: Repo = configurado ? repoSupabase : process.env.EH_EN_NETLIFY === '1' && process.env.MODO_PRUEBA !== '1' ? sinConfigurar : repoMemoria

/** El catálogo es chico: se carga entero una vez por solicitud y se reutiliza. */
export const catalogo = cache(() => repo.catalogo())
