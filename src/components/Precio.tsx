import { formatoPrecio, partesPrecio } from '@/lib/domain/pricing'

/**
 * Precio grande con los centavos más pequeños y arriba: $54.00, $43.99.
 * El tamaño y el color los da `className` (ej. "display text-5xl text-sky").
 */
export function Precio({ valor, className = '', tachado = false }: { valor: number; className?: string; tachado?: boolean }) {
  const { entero, centavos } = partesPrecio(valor)
  return (
    <span className={`inline-flex items-start leading-none ${tachado ? 'line-through' : ''} ${className}`} aria-label={formatoPrecio(valor)}>
      <span aria-hidden className="mt-[0.08em] text-[0.5em]">$</span>
      <span aria-hidden>{entero}</span>
      <span aria-hidden className="mt-[0.08em] text-[0.5em]">.{centavos}</span>
    </span>
  )
}
