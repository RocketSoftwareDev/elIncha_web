// Página de soporte: el admin escribe cada sección como texto simple y aquí se
// convierte en bloques. Nunca se interpreta HTML: lo que escriba se muestra tal cual.

import type { SeccionSoporte } from './types'

export const MAX_SECCIONES = 12
export const MAX_TITULO = 40
export const MAX_CONTENIDO = 4000

/** Las sugeridas para empezar: vacías y ocultas hasta que el admin las llene. */
export const SECCIONES_SUGERIDAS: SeccionSoporte[] = [
  { id: 'como-comprar', titulo: 'Cómo comprar', contenido: '', visible: false },
  { id: 'guia-de-tallas', titulo: 'Guía de tallas', contenido: '', visible: false },
  { id: 'envios', titulo: 'Envíos a El Oro', contenido: '', visible: false },
  { id: 'cambios', titulo: 'Cambios', contenido: '', visible: false },
  { id: 'guia-de-lavado', titulo: 'Guía de lavado', contenido: '', visible: false },
]

export type Bloque =
  | { tipo: 'parrafo'; texto: string }
  | { tipo: 'lista'; items: string[] }
  | { tipo: 'tabla'; cabecera: string[]; filas: string[][] }

const esFila = (l: string) => l.includes('|')
const esViñeta = (l: string) => /^[-•*]\s+/.test(l)
const celdas = (l: string) => l.replace(/^\||\|$/g, '').split('|').map(c => c.trim())

/**
 * Línea en blanco separa párrafos. Líneas seguidas que empiezan con «- » forman una
 * lista. Líneas seguidas con «|» forman una tabla; la primera es la cabecera
 * (una fila «---|---» debajo se ignora, por si lo copian de otro lado).
 */
export function aBloques(contenido: string): Bloque[] {
  const bloques: Bloque[] = []
  const lineas = contenido.replace(/\r\n?/g, '\n').split('\n').map(l => l.trim())
  let i = 0
  while (i < lineas.length) {
    const l = lineas[i]
    if (!l) { i++; continue }
    if (esViñeta(l)) {
      const items: string[] = []
      while (i < lineas.length && esViñeta(lineas[i])) items.push(lineas[i++].replace(/^[-•*]\s+/, ''))
      bloques.push({ tipo: 'lista', items })
    } else if (esFila(l)) {
      const filas: string[][] = []
      while (i < lineas.length && esFila(lineas[i])) {
        const f = celdas(lineas[i++])
        if (!f.every(c => /^:?-+:?$/.test(c))) filas.push(f)
      }
      if (filas.length === 0) continue
      const [cabecera, ...resto] = filas
      const ancho = Math.max(...filas.map(f => f.length))
      const completar = (f: string[]) => [...f, ...Array(ancho - f.length).fill('')]
      bloques.push({ tipo: 'tabla', cabecera: completar(cabecera), filas: resto.map(completar) })
    } else {
      const texto: string[] = []
      while (i < lineas.length && lineas[i] && !esViñeta(lineas[i]) && !esFila(lineas[i])) texto.push(lineas[i++])
      bloques.push({ tipo: 'parrafo', texto: texto.join(' ') })
    }
  }
  return bloques
}

/** Solo se publica lo que el admin marcó visible y tiene texto. */
export const seccionesPublicas = (s: SeccionSoporte[] = []) => s.filter(x => x.visible && x.contenido.trim())

/** id legible para el ancla de la URL (/soporte#guia-de-tallas). */
export function idSeccion(titulo: string, usados: string[]): string {
  const base = titulo.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40) || 'seccion'
  let id = base
  for (let n = 2; usados.includes(id); n++) id = `${base}-${n}`
  return id
}
