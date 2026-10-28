import { useId } from 'react'
import { largo } from '@/lib/domain/dorsal'

// Silueta genérica blanca (no depende de la foto de cada camiseta) con el texto
// encima. Solo SVG: se actualiza al instante mientras el cliente escribe.

const COLOR = '#0a1a44'
const FUENTE = { fontFamily: 'var(--font-dorsal)' }

function tamañoNombre(nombre: string) {
  const n = largo(nombre)
  return n <= 5 ? 46 : n <= 7 ? 40 : n <= 9 ? 34 : 30
}

interface Props { nombre: string; numero: string; color?: string; className?: string }

export function VistaPreviaCamiseta({ nombre, numero, color = COLOR, className }: Props) {
  const arco = useId()
  return (
    <svg viewBox="0 0 400 440" role="img" aria-label={`Vista previa: ${nombre || 'sin nombre'} ${numero}`} className={className}>
      <image href="/brand/silueta-camiseta.svg" width="400" height="440" />
      <path id={arco} d="M 110 150 Q 200 128 290 150" fill="none" />
      {nombre && (
        <text style={FUENTE} fontWeight={700} fontSize={tamañoNombre(nombre)} letterSpacing="2" fill={color} textAnchor="middle">
          <textPath href={`#${arco}`} startOffset="50%">{nombre}</textPath>
        </text>
      )}
      {numero && (
        <text x="200" y="320" style={FUENTE} fontWeight={700} fontSize="168" fill={color} textAnchor="middle">{numero}</text>
      )}
    </svg>
  )
}

export function VistaPreviaShort({ numero, color = COLOR, className }: Omit<Props, 'nombre'>) {
  return (
    <svg viewBox="0 0 300 240" role="img" aria-label={`Vista previa del short: ${numero || 'sin número'}`} className={className}>
      <image href="/brand/silueta-short.svg" width="300" height="240" />
      {numero && (
        <text x="222" y="170" style={FUENTE} fontWeight={700} fontSize="44" fill={color} textAnchor="middle">{numero}</text>
      )}
    </svg>
  )
}
