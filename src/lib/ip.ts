import 'server-only'

/**
 * IP del visitante, solo para límites contra abuso y el identificador anónimo del día.
 * Nunca se guarda tal cual.
 *  - Netlify: x-nf-client-connection-ip la pone Netlify y no se puede falsificar.
 *  - VPS con Cloudflare (más adelante): cf-connecting-ip.
 *  - x-forwarded-for solo como último recurso (en local).
 */
export function ipCliente(h: Headers): string {
  return (
    h.get('x-nf-client-connection-ip') ??
    h.get('cf-connecting-ip') ??
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'desconocida'
  ).slice(0, 64)
}
