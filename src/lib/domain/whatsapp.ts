// Mensaje que recibe el dueño por WhatsApp. En producción lo arma el back
// (POST /orders devuelve whatsappUrl); aquí se usa con los datos de prueba.

import { formatoPrecio } from './pricing'

export interface LineaMensaje {
  cantidad: number
  titulo: string
  detalle: string
  subtotal: number
  dorsal?: string
}

export interface DatosMensaje {
  saludo: string
  drop: string
  lineas: LineaMensaje[]
  total: number
  reserva: number
  cliente: string
  sector: string
  codigo: string
}

export function armarMensaje(d: DatosMensaje): string {
  const items = d.lineas.map(l => {
    const cabecera = `${l.cantidad}× ${l.titulo} · ${l.detalle} — ${formatoPrecio(l.subtotal)}`
    return l.dorsal ? `${cabecera}\n    ${l.dorsal}` : cabecera
  })
  return [
    `${d.saludo}`,
    `(${d.drop})`,
    '',
    ...items,
    '',
    `Total: ${formatoPrecio(d.total)} · Reserva: ${formatoPrecio(d.reserva)}`,
    `Nombre: ${d.cliente} · Entrega: ${d.sector}`,
    '',
    `Pedido #${d.codigo}`,
  ].join('\n')
}

/** Solo dígitos: wa.me no acepta "+", espacios ni guiones. */
export function enlaceWhatsapp(numero: string, mensaje: string): string {
  return `https://wa.me/${numero.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`
}
