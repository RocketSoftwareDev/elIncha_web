// Estado del drop visto por el cliente. La hora que manda es la del servidor;
// el reloj del navegador solo anima la cuenta regresiva.

import type { Drop } from './types'

export const ZONA = 'America/Guayaquil'

export interface Restante {
  dias: number
  horas: number
  minutos: number
  segundos: number
  terminado: boolean
}

export function restante(cierraEn: string, ahora: number): Restante {
  const ms = Math.max(0, new Date(cierraEn).getTime() - ahora)
  const s = Math.floor(ms / 1000)
  return {
    dias: Math.floor(s / 86400),
    horas: Math.floor((s % 86400) / 3600),
    minutos: Math.floor((s % 3600) / 60),
    segundos: s % 60,
    terminado: ms === 0,
  }
}

/** Un drop solo acepta pedidos si está abierto y no pasó su cierre. */
export function aceptaPedidos(drop: Drop | null, ahora: number): boolean {
  return !!drop && drop.estado === 'abierto' && new Date(drop.cierraEn).getTime() > ahora
}

const fecha = new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'short', timeZone: ZONA })
const fechaLarga = new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'long', timeZone: ZONA })

export function fechaCorta(iso: string): string {
  return fecha.format(new Date(iso)).replace('.', '')
}

export function llegada(drop: Drop): { desde: Date; hasta: Date } {
  const cierre = new Date(drop.cierraEn).getTime()
  const dia = 86400000
  return { desde: new Date(cierre + drop.llegadaMinDias * dia), hasta: new Date(cierre + drop.llegadaMaxDias * dia) }
}

/** «Pide hasta el 30 de octubre · llega entre el 29 de noviembre y 29 de diciembre» */
export function resumenDrop(drop: Drop): { pideHasta: string; llegaEntre: string } {
  const { desde, hasta } = llegada(drop)
  return {
    pideHasta: fechaLarga.format(new Date(drop.cierraEn)),
    llegaEntre: `${fechaLarga.format(desde)} y ${fechaLarga.format(hasta)}`,
  }
}

export const dosDigitos = (n: number) => String(n).padStart(2, '0')
