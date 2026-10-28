import { describe, expect, it } from 'vitest'
import { clasificarFuente, convierteMal, dispositivo, esBot, normalizarTermino, porcentaje } from './analitica'

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 350.0'
const PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36'

describe('esBot', () => {
  it('descarta bots que se identifican y la vista previa de enlaces de WhatsApp', () => {
    expect(esBot('Googlebot/2.1 (+http://www.google.com/bot.html)')).toBe(true)
    expect(esBot('WhatsApp/2.24.1 A')).toBe(true)
    expect(esBot('facebookexternalhit/1.1')).toBe(true)
    expect(esBot('')).toBe(true)
  })

  it('deja pasar navegadores reales', () => {
    expect(esBot(IPHONE)).toBe(false)
    expect(esBot(PC)).toBe(false)
  })
})

describe('dispositivo', () => {
  it('distingue celular y computadora', () => {
    expect(dispositivo(IPHONE)).toBe('celular')
    expect(dispositivo(PC)).toBe('computadora')
  })
})

describe('clasificarFuente', () => {
  it('el enlace etiquetado manda sobre la página de origen', () => {
    expect(clasificarFuente({ utmSource: 'WhatsApp', referrer: 'https://l.instagram.com/' })).toBe('whatsapp')
    expect(clasificarFuente({ utmSource: 'ig' })).toBe('instagram')
    expect(clasificarFuente({ utmSource: 'volante' })).toBe('otro')
  })

  it('reconoce Instagram, Google y Facebook por la página de origen', () => {
    expect(clasificarFuente({ referrer: 'https://l.instagram.com/?u=x' })).toBe('instagram')
    expect(clasificarFuente({ referrer: 'https://www.google.com.ec/' })).toBe('google')
    expect(clasificarFuente({ referrer: 'https://m.facebook.com/' })).toBe('facebook')
  })

  it('sin origen o desde el propio sitio es directo (aquí cae WhatsApp sin etiqueta)', () => {
    expect(clasificarFuente({})).toBe('directo')
    expect(clasificarFuente({ referrer: 'https://www.elhinchamachala.com/vitrina' })).toBe('directo')
  })
})

describe('utilidades', () => {
  it('normaliza búsquedas', () => {
    expect(normalizarTermino('  Selección   COLOMBIA ')).toBe('seleccion colombia')
  })

  it('formatea porcentajes', () => {
    expect(porcentaje(41, 1120)).toBe('3,7 %')
    expect(porcentaje(29, 41)).toBe('71 %')
    expect(porcentaje(1, 0)).toBe('0 %')
  })

  it('marca lo que se visita mucho y se vende poco', () => {
    expect(convierteMal(510, 4, 0.03)).toBe(true)
    expect(convierteMal(320, 12, 0.03)).toBe(false)
    expect(convierteMal(20, 0, 0.03)).toBe(false) // muy pocas visitas para concluir
  })
})
