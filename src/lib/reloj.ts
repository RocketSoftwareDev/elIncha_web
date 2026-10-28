import 'server-only'

/**
 * Hora del servidor. En los Server Components la hora del servidor es la que
 * decide si un drop sigue abierto; se lee una vez por solicitud.
 */
export function ahora(): number {
  return Date.now()
}
