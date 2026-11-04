import { describe, expect, it } from 'vitest'
import { armarMensaje, enlaceWhatsapp } from './whatsapp'

const mensaje = armarMensaje({
  saludo: '¡Hola El Hincha! ⚽ Quiero hacer este pedido',
  drop: 'Drop Noviembre',
  lineas: [
    { cantidad: 1, titulo: 'Combo Kit completo', detalle: 'Real Madrid Local 25/26 + Short Player · Talla L · Short M · Sin sponsors', subtotal: 56, dorsal: "O'NEILL #07 + parche Champions League" },
    { cantidad: 1, titulo: 'Ecuador Mundial 2002', detalle: 'Retro · Talla XL', subtotal: 39.99 },
  ],
  total: 95.99,
  reserva: 5,
  cliente: 'Carlos',
  sector: 'Cdla. Las Brisas',
  codigo: 'EH-0142',
})

describe('armarMensaje', () => {
  it('incluye código, total y reserva fija', () => {
    expect(mensaje).toContain('Pedido #EH-0142')
    expect(mensaje).toContain('Total: $95.99 · Reserva: $5.00')
  })

  it('pantaloneta, su talla y «sin sponsors» llegan al dueño; centavos con 2 decimales', () => {
    expect(mensaje).toContain('1× Ecuador Mundial 2002 · Retro · Talla XL — $39.99')
  })

  it('pone el dorsal debajo de su prenda', () => {
    expect(mensaje).toContain("Real Madrid Local 25/26 + Short Player · Talla L · Short M · Sin sponsors — $56.00\n    O'NEILL #07")
  })
})

describe('enlaceWhatsapp', () => {
  it('deja solo dígitos en el número y codifica el texto', () => {
    const url = enlaceWhatsapp('+593 99 999-9999', mensaje)
    expect(url.startsWith('https://api.whatsapp.com/send?phone=593999999999&text=')).toBe(true)
    expect(url).not.toContain(' ')
    expect(decodeURIComponent(url.split('text=')[1])).toBe(mensaje)
  })

  it('conserva emojis, Ñ y tildes (wa.me dañaba el ⚽)', () => {
    const url = enlaceWhatsapp('0999', '⚽ MUÑOZ · Múnich')
    expect(decodeURIComponent(url.split('text=')[1])).toBe('⚽ MUÑOZ · Múnich')
  })
})
