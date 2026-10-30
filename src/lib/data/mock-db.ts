import 'server-only'

// Base de datos de prueba en memoria. Vive en el servidor de Next y se reinicia
// con él: sirve para ver y probar la tienda y el admin sin back ni Docker.

import type {
  Ajustes, Combo, Drop, Equipo, Liga, Parche, Pedido, Producto, Stock, TipoPrenda,
} from '@/lib/domain/types'

export interface MockDb {
  drops: Drop[]
  ligas: Liga[]
  equipos: Equipo[]
  tipos: TipoPrenda[]
  parches: Parche[]
  productos: Producto[]
  combos: Combo[]
  stock: Stock[]
  ajustes: Ajustes
  pedidos: Pedido[]
  secuenciaPedido: number
}

const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

function semilla(): MockDb {
  const ligas: Liga[] = [
    ['laliga', 'LaLiga'], ['premier', 'Premier League'], ['bundesliga', 'Bundesliga'], ['mls', 'MLS'],
    ['nacionales', 'Nacionales'], ['brasil-argentina', 'Brasil y Argentina'], ['retro', 'Retro'], ['musculeras', 'Musculeras'],
  ].map(([slug, nombre], i) => ({ id: `l-${slug}`, slug, nombre, foto: `/mock/liga-${slug}.jpg`, orden: i, visible: true }))

  const equipos: Equipo[] = [
    ['real-madrid', 'laliga', 'Real Madrid'], ['barcelona', 'laliga', 'FC Barcelona'], ['atletico', 'laliga', 'Atlético de Madrid'], ['betis', 'laliga', 'Real Betis'],
    ['man-city', 'premier', 'Manchester City'], ['arsenal', 'premier', 'Arsenal'],
    ['bayern', 'bundesliga', 'Bayern Múnich'], ['dortmund', 'bundesliga', 'Borussia Dortmund'], ['leverkusen', 'bundesliga', 'Bayer Leverkusen'],
    ['inter-miami', 'mls', 'Inter Miami'],
    ['emelec', 'nacionales', 'Emelec'], ['bsc', 'nacionales', 'Barcelona SC'], ['ldu', 'nacionales', 'Liga de Quito'],
    ['brasil', 'brasil-argentina', 'Brasil'], ['argentina', 'brasil-argentina', 'Argentina'],
    ['ecuador', 'retro', 'Ecuador'], ['hincha', 'musculeras', 'El Hincha'],
  ].map(([id, liga, nombre], i) => ({ id: `e-${id}`, ligaId: `l-${liga}`, nombre, orden: i, escudo: '' }))

  const tipos: TipoPrenda[] = [
    ['player', 'Camiseta Player', 40, true, false], ['retro', 'Retro', 38, true, false], ['buzo', 'Buzo', 40, false, false],
    ['musculera', 'Musculera', 27, false, false], ['coach', 'Camisa de entrenamiento / Coach', 27, false, false], ['short', 'Short Player', 20, true, true],
  ].map(([id, nombre, precio, acepta, esShort], i) => ({
    id: `t-${id}`, nombre: nombre as string, precio: precio as number, tallas: TALLAS,
    aceptaPersonalizacion: acepta as boolean, esShort: esShort as boolean, orden: i,
  }))

  const parches: Parche[] = [
    ['ucl', 'Champions League'], ['lib', 'Copa Libertadores'], ['wc', 'Copa Mundial'],
    ['ligapro', 'LigaPro Ecuador'], ['epl', 'Premier League'], ['laliga', 'LaLiga'], ['bundes', 'Bundesliga'],
  ].map(([id, nombre]) => ({ id: `p-${id}`, nombre, precio: 1, activo: true }))

  const p = (
    slug: string, equipo: string, tipo: string, nombre: string, fotos: string[], parchesIds: string[], extra: Partial<Producto> = {},
  ): Producto => ({
    id: `pr-${slug}`, slug, equipoId: `e-${equipo}`, tipoId: `t-${tipo}`, nombre, precioEspecial: null,
    visible: true, destacado: false, fotos: fotos.map(f => `/mock/${f}`), parchesPermitidos: parchesIds.map(x => `p-${x}`), ...extra,
  })

  const productos: Producto[] = [
    p('real-madrid-local-25-26', 'real-madrid', 'player', 'Local 25/26', ['detalle-1.jpg', 'prod-1.jpg', 'detalle-2.jpg'], ['ucl', 'laliga'], { destacado: true }),
    p('real-madrid-short-local', 'real-madrid', 'short', 'Short Local 25/26', ['short.jpg'], []),
    p('barcelona-local-25-26', 'barcelona', 'player', 'Local 25/26', ['prod-2.jpg', 'detalle-3.jpg'], ['ucl', 'laliga']),
    p('barcelona-visitante-25-26', 'barcelona', 'player', 'Visitante 25/26', ['prod-5.jpg'], ['ucl', 'laliga']),
    p('atletico-local-25-26', 'atletico', 'player', 'Local 25/26', ['prod-3.jpg'], ['ucl', 'laliga']),
    p('betis-visitante-25-26', 'betis', 'player', 'Visitante 25/26', ['prod-4.jpg'], ['laliga']),
    p('man-city-local-25-26', 'man-city', 'player', 'Local 25/26', ['prod-6.jpg'], ['ucl', 'epl']),
    p('arsenal-local-25-26', 'arsenal', 'player', 'Local 25/26', ['prod-9.jpg'], ['ucl', 'epl']),
    p('bayern-local-25-26', 'bayern', 'player', 'Local 25/26', ['detalle-3.jpg', 'prod-1.jpg'], ['ucl', 'bundes'], { destacado: true }),
    p('bayern-retro-2001', 'bayern', 'retro', 'Retro 2001 (Final Champions)', ['prod-9.jpg'], ['ucl']),
    p('dortmund-local-25-26', 'dortmund', 'player', 'Local 25/26', ['prod-8.jpg'], ['ucl', 'bundes']),
    p('inter-miami-local', 'inter-miami', 'player', 'Local 2026', ['prod-2.jpg'], []),
    p('emelec-local-2025', 'emelec', 'player', 'Local 2025', ['prod-7.jpg'], ['ligapro', 'lib'], { destacado: true }),
    p('emelec-buzo-entrenamiento', 'emelec', 'buzo', 'Buzo de entrenamiento', ['prod-7.jpg'], []),
    p('bsc-amarilla-2025', 'bsc', 'player', 'Local 2025', ['prod-8.jpg'], ['ligapro', 'lib'], { visible: false }),
    p('ldu-local-2025', 'ldu', 'player', 'Local 2025', ['prod-6.jpg'], ['ligapro', 'lib']),
    p('brasil-local-2026', 'brasil', 'player', 'Local 2026', ['prod-8.jpg'], ['wc']),
    p('argentina-local-2026', 'argentina', 'player', 'Local 2026', ['prod-5.jpg'], ['wc']),
    p('ecuador-mundial-2002', 'ecuador', 'retro', 'Mundial 2002', ['prod-9.jpg'], ['wc'], { destacado: true }),
    p('musculera-hincha-navy', 'hincha', 'musculera', 'Musculera Hincha Navy', ['prod-10.jpg'], []),
  ]

  const combos: Combo[] = [{ id: 'c-kit', nombre: 'Kit completo', precio: 55, activo: true, tipos: ['t-player', 't-short'] }]

  const drops: Drop[] = [
    { id: 'd-2026-11', nombre: 'Drop Noviembre', abreEn: '2026-10-01T05:00:00Z', cierraEn: '2026-10-31T04:59:00Z', envioEn: '2026-10-31T15:00:00Z', llegadaMinDias: 20, llegadaMaxDias: 30, estado: 'abierto', mostrarCuentaRegresiva: true },
    { id: 'd-2026-10', nombre: 'Drop Octubre', abreEn: '2026-09-01T05:00:00Z', cierraEn: '2026-10-01T04:59:00Z', envioEn: '2026-10-01T15:00:00Z', llegadaMinDias: 20, llegadaMaxDias: 30, estado: 'en_camino', mostrarCuentaRegresiva: true },
    { id: 'd-2026-09', nombre: 'Drop Septiembre', abreEn: '2026-08-01T05:00:00Z', cierraEn: '2026-09-01T04:59:00Z', envioEn: '2026-09-01T15:00:00Z', llegadaMinDias: 20, llegadaMaxDias: 30, estado: 'entregado', mostrarCuentaRegresiva: true },
  ]

  const ajustes: Ajustes = {
    whatsapp: '+593 99 999 9999',
    horario: 'Lun a Sáb · 9:00 – 20:00',
    saludo: '¡Hola El Hincha! ⚽ Quiero hacer este pedido',
    montoReserva: 5,
    metodosPago: [
      { id: 'transferencia', nombre: 'Transferencia bancaria', detalle: 'Banco Pichincha · Cta. ahorros', activo: true },
      { id: 'deuna', nombre: 'DeUna / transferencia QR', detalle: 'Te enviamos el QR por chat', activo: true },
      { id: 'efectivo', nombre: 'Efectivo contra entrega', detalle: 'Solo Machala', activo: false },
    ],
    pasosComoComprar: [
      'Elige liga, equipo y talla. Nombre y número van gratis.',
      'Te llega todo listo en un mensaje. Confirmamos tallas y personalización.',
      'Por transferencia o DeUna. El resto lo coordinamos contigo por chat.',
      'Después del cierre del drop. Te avisamos por chat y te la entregamos en Machala.',
    ],
    redes: { instagram: '@elhincha.machala', tiktok: '@elhincha.ec', facebook: 'El Hincha Machala' },
  }

  const pedido = (n: number, cliente: string, sector: string, total: number, estado: Pedido['estado'], horas: number, items: Pedido['items'] = []): Pedido => ({
    id: `o-${n}`, codigo: `EH-${String(n).padStart(4, '0')}`, dropId: 'd-2026-11', clienteNombre: cliente,
    clienteWhatsapp: '+593 98 *** ****', sector, total, reserva: 5, estado,
    creadoEn: new Date(Date.UTC(2026, 9, 28, 17) - horas * 3600000).toISOString(), items,
  })

  const pedidos: Pedido[] = [
    pedido(142, 'Carlos V.', 'Cdla. Las Brisas, Machala', 135, 'por_confirmar', 0, [
      { id: 'i1', descripcion: 'Combo Kit completo', detalle: 'Real Madrid Local 25/26 + Short Local · Talla L', talla: 'L', cantidad: 1, dorsalNombre: 'VERA', dorsalNumero: '10', shortNumero: '10', parches: [{ nombre: 'Champions League', precio: 1 }], precioUnitario: 56, subtotal: 56, comboId: 'c-kit', productoId: 'pr-real-madrid-local-25-26' },
      { id: 'i2', descripcion: 'Barcelona Visitante 25/26', detalle: 'Camiseta Player · Talla M', talla: 'M', cantidad: 1, dorsalNombre: null, dorsalNumero: null, shortNumero: null, parches: [], precioUnitario: 40, subtotal: 40, comboId: null, productoId: 'pr-barcelona-visitante-25-26' },
      { id: 'i3', descripcion: 'Ecuador Mundial 2002', detalle: 'Retro · Talla XL', talla: 'XL', cantidad: 1, dorsalNombre: 'MOISÉS', dorsalNumero: '7', shortNumero: null, parches: [{ nombre: 'Copa Mundial', precio: 1 }], precioUnitario: 39, subtotal: 39, comboId: null, productoId: 'pr-ecuador-mundial-2002' },
    ]),
    pedido(141, 'Andrea M.', 'Centro, Machala', 40, 'reserva_pagada', 3),
    pedido(140, 'Jordy P.', 'Pasaje', 55, 'reserva_pagada', 7),
    pedido(139, 'Luis T.', 'Puerto Bolívar', 105, 'pagado', 20),
    pedido(138, 'Kevin R.', 'Cdla. Unioro', 38, 'por_confirmar', 26),
    pedido(137, 'María J.', 'Santa Rosa', 67, 'reserva_pagada', 40),
    pedido(136, 'Bryan C.', 'El Guabo', 27, 'cancelado', 52),
  ]

  // Sobrantes de un drop anterior: se venden ya, sin personalizar.
  const stock: Stock[] = [
    { id: 's-bayern-m', productoId: 'pr-bayern-local-25-26', talla: 'M', cantidad: 3, precio: null },
    { id: 's-emelec-l', productoId: 'pr-emelec-local-2025', talla: 'L', cantidad: 2, precio: 32 },
    { id: 's-barca-s', productoId: 'pr-barcelona-local-25-26', talla: 'S', cantidad: 1, precio: null },
  ]

  return { drops, ligas, equipos, tipos, parches, productos, combos, stock, ajustes, pedidos, secuenciaPedido: 142 }
}

// Sobrevive a la recarga en caliente de `next dev`.
const g = globalThis as unknown as { __elhinchaMockDb?: MockDb }
export const db: MockDb = (g.__elhinchaMockDb ??= semilla())

export function reiniciarDatos() {
  g.__elhinchaMockDb = semilla()
  Object.assign(db, g.__elhinchaMockDb)
}
