'use client'

import type { EventoEntrada } from '@/lib/domain/analitica'

// Avisos mínimos al servidor. Sin cookies: el origen de la visita se recuerda solo
// durante la pestaña (sessionStorage) para atribuirle también el carrito.

const CLAVE = 'eh-origen'

function origen(): { referrer?: string; utmSource?: string } {
  try {
    const guardado = sessionStorage.getItem(CLAVE)
    if (guardado) return JSON.parse(guardado)
    const utm = new URLSearchParams(location.search).get('utm_source') ?? undefined
    const externo = document.referrer && !document.referrer.startsWith(location.origin) ? document.referrer : undefined
    const o = { referrer: externo?.slice(0, 300), utmSource: utm?.slice(0, 40) }
    sessionStorage.setItem(CLAVE, JSON.stringify(o))
    return o
  } catch {
    return {}
  }
}

export function registrar(e: EventoEntrada) {
  try {
    const cuerpo = JSON.stringify({ ...origen(), ...e })
    // sendBeacon no hace esperar a la página y sobrevive si el cliente se va.
    if (!navigator.sendBeacon?.('/api/e', new Blob([cuerpo], { type: 'application/json' }))) {
      void fetch('/api/e', { method: 'POST', body: cuerpo, keepalive: true, headers: { 'content-type': 'application/json' } })
    }
  } catch {
    // Las estadísticas nunca deben romper la tienda.
  }
}
