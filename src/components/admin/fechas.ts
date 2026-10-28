import { ZONA } from '@/lib/domain/drop'

// Ecuador no tiene horario de verano: la hora local siempre es UTC−5.
const OFFSET_MS = 5 * 3600000

/** ISO UTC → valor de <input type="datetime-local"> en hora de Ecuador. */
export function isoAInput(iso: string): string {
  return new Date(new Date(iso).getTime() - OFFSET_MS).toISOString().slice(0, 16)
}

/** Valor de <input type="datetime-local"> (hora de Ecuador) → ISO UTC. */
export function inputAIso(valor: string): string {
  return new Date(`${valor}:00-05:00`).toISOString()
}

const fechaHora = new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONA })
const diaMes = new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'short', timeZone: ZONA })

export function fechaYHora(iso: string): string {
  return fechaHora.format(new Date(iso)).replace('.', '').replace(',', ' ·')
}

/** «30 OCT» para la línea de tiempo y el historial. */
export function diaMesCorto(fecha: Date | string): string {
  return diaMes.format(new Date(fecha)).replace('.', '').toUpperCase()
}
