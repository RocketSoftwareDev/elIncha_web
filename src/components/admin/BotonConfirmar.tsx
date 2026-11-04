'use client'

/** Botón de envío que pide confirmación antes (para acciones que borran algo). */
export function BotonConfirmar({ pregunta, className, etiqueta, children }: { pregunta: string; className: string; etiqueta: string; children: React.ReactNode }) {
  return (
    <button type="submit" aria-label={etiqueta} className={className} onClick={e => { if (!confirm(pregunta)) e.preventDefault() }}>
      {children}
    </button>
  )
}
