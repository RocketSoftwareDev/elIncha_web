import { largo } from '@/lib/domain/dorsal'

// Silueta genérica blanca (no depende de la foto de cada camiseta) con el texto
// encima. Solo SVG: se actualiza al instante mientras el cliente escribe.

const COLOR = '#0a1a44'

function tamañoNombre(nombre: string) {
  const n = largo(nombre)
  return n <= 5 ? 46 : n <= 7 ? 40 : n <= 9 ? 34 : 30
}

export function VistaPreviaCamiseta({ nombre, numero, className }: { nombre: string; numero: string; className?: string }) {
  return (
    <svg viewBox="0 0 400 440" role="img" aria-label={`Vista previa: ${nombre || 'sin nombre'} ${numero}`} className={className}>
      <image href="/brand/silueta-camiseta.svg" width="400" height="440" />
      <path id="arco-nombre" d="M 110 150 Q 200 128 290 150" fill="none" />
      {nombre && (
        <text style={{ fontFamily: 'var(--font-dorsal)' }} fontWeight={700} fontSize={tamañoNombre(nombre)} letterSpacing="2" fill={COLOR} textAnchor="middle">
          <textPath href="#arco-nombre" startOffset="50%">{nombre}</textPath>
        </text>
      )}
      {numero && (
        <text x="200" y="320" style={{ fontFamily: 'var(--font-dorsal)' }} fontWeight={700} fontSize="168" fill={COLOR} textAnchor="middle">
          {numero}
        </text>
      )}
    </svg>
  )
}

export function VistaPreviaShort({ numero, className }: { numero: string; className?: string }) {
  return (
    <svg viewBox="0 0 300 240" role="img" aria-label={`Vista previa del short: ${numero || 'sin número'}`} className={className}>
      <image href="/brand/silueta-short.svg" width="300" height="240" />
      {numero && (
        <text x="222" y="170" style={{ fontFamily: 'var(--font-dorsal)' }} fontWeight={700} fontSize="44" fill={COLOR} textAnchor="middle">
          {numero}
        </text>
      )}
    </svg>
  )
}
