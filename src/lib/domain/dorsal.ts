// Reglas del nombre y número del dorsal. Las mismas que valida el back:
// la web avisa mientras se escribe, pero la API es la que decide.

export const MAX_NOMBRE = 10

const NOMBRE_RE = /^[A-ZÑÁÉÍÓÚÜ' .-]+$/u
const NUMERO_RE = /^\d{1,2}$/

/** Mayúsculas, acentos compuestos (É = 1 carácter), apóstrofe recto y un solo espacio. */
export function normalizarNombre(input: string): string {
  return input
    .normalize('NFC')
    .replace(/[’‘`´]/g, "'")
    .toLocaleUpperCase('es')
    .replace(/\s+/g, ' ')
    .trimStart()
}

/** Cuenta caracteres visibles (no unidades UTF-16). */
export function largo(texto: string): number {
  return [...texto.normalize('NFC')].length
}

export type ErrorDorsal = 'largo' | 'caracteres' | null

export function validarNombre(nombre: string): ErrorDorsal {
  const n = normalizarNombre(nombre).trim()
  if (n === '') return null
  if (largo(n) > MAX_NOMBRE) return 'largo'
  if (!NOMBRE_RE.test(n)) return 'caracteres'
  return null
}

/** Solo dígitos, máximo 2. Se guarda como texto: "07" no es "7". */
export function normalizarNumero(input: string): string {
  return input.replace(/\D/g, '').slice(0, 2)
}

export function validarNumero(numero: string): boolean {
  return numero === '' || NUMERO_RE.test(numero)
}

export const MENSAJE_ERROR: Record<Exclude<ErrorDorsal, null>, string> = {
  largo: `Máximo ${MAX_NOMBRE} caracteres, contando espacios.`,
  caracteres: 'Solo letras, Ñ, tildes, espacio, punto, guion y apóstrofe.',
}
