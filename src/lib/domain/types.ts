// Modelo de dominio compartido por la tienda y el admin.
// Refleja las tablas del back (elIncha_back/src/db/schema.ts).

export type Id = string

export type EstadoDrop = 'borrador' | 'abierto' | 'cerrado' | 'en_camino' | 'entregado'
export type EstadoPedido = 'por_confirmar' | 'reserva_pagada' | 'pagado' | 'entregado' | 'cancelado'

export interface Drop {
  id: Id
  nombre: string
  abreEn: string // ISO UTC
  cierraEn: string
  envioEn: string
  llegadaMinDias: number
  llegadaMaxDias: number
  estado: EstadoDrop
  mostrarCuentaRegresiva: boolean
  pedidos?: number
  prendas?: number
  vendido?: number
  reservasPagadas?: number
}

export interface Liga {
  id: Id
  slug: string
  nombre: string
  foto: string
  orden: number
  visible: boolean
}

export interface Equipo {
  id: Id
  ligaId: Id
  nombre: string
  orden: number
  /** URL del escudo (WebP con transparencia) o '' si todavía no tiene. */
  escudo: string
}

export interface TipoPrenda {
  id: Id
  nombre: string
  precio: number
  tallas: string[]
  aceptaPersonalizacion: boolean
  esShort: boolean
  orden: number
}

export interface Parche {
  id: Id
  nombre: string
  precio: number
  activo: boolean
}

export interface Producto {
  id: Id
  slug: string
  equipoId: Id
  tipoId: Id
  nombre: string
  precioEspecial: number | null
  visible: boolean
  destacado: boolean
  fotos: string[]
  parchesPermitidos: Id[]
}

export interface Combo {
  id: Id
  nombre: string
  precio: number
  activo: boolean
  tipos: Id[]
}

export interface MetodoPago {
  id: string
  nombre: string
  detalle: string
  activo: boolean
}

export interface Ajustes {
  whatsapp: string
  horario: string
  saludo: string
  montoReserva: number
  metodosPago: MetodoPago[]
  pasosComoComprar: string[]
  redes: { instagram: string; tiktok: string; facebook: string }
}

export interface Personalizacion {
  nombre: string
  numero: string
  numeroShort: string
  parches: Id[]
}

export interface PedidoItem {
  id: Id
  descripcion: string
  detalle: string
  talla: string
  cantidad: number
  dorsalNombre: string | null
  dorsalNumero: string | null
  shortNumero: string | null
  parches: { nombre: string; precio: number }[]
  precioUnitario: number
  subtotal: number
  comboId: Id | null
  productoId: Id | null
}

export interface Pedido {
  id: Id
  codigo: string
  dropId: Id
  clienteNombre: string
  clienteWhatsapp: string
  sector: string
  total: number
  reserva: number
  estado: EstadoPedido
  creadoEn: string
  items: PedidoItem[]
}

/** Producto con todo lo que necesita la vitrina para mostrarse. */
export interface ProductoVista extends Producto {
  equipo: Equipo
  liga: Liga
  tipo: TipoPrenda
  precio: number
  parches: Parche[]
}
