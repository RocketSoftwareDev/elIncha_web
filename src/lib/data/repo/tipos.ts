// Contrato de almacenamiento. Dos implementaciones:
//  - memoria: datos de prueba (desarrollo local, sin configurar nada)
//  - supabase: la etapa gratis en Netlify
// Las reglas del negocio viven en tienda.ts / admin.ts / estadisticas.ts, no aquí.

import type { Dispositivo, Fuente, TipoEvento } from '@/lib/domain/analitica'
import type {
  Ajustes, Combo, Drop, Equipo, EstadoPedido, Liga, Parche, Pedido, Producto, TipoPrenda,
} from '@/lib/domain/types'

export interface DatosCatalogo {
  drops: Drop[]
  ligas: Liga[]
  equipos: Equipo[]
  tipos: TipoPrenda[]
  parches: Parche[]
  productos: Producto[]
  combos: Combo[]
  ajustes: Ajustes
}

export interface EventoGuardado {
  tipo: TipoEvento
  ruta: string | null
  productoId: string | null
  termino: string | null
  visitante: string
  fuente: Fuente
  dispositivo: Dispositivo
  creadoEn: number
}

export interface FiltroPedidos {
  dropId?: string
  estado?: EstadoPedido
  desde?: number
  hasta?: number
}

export type PedidoNuevo = Omit<Pedido, 'id' | 'codigo' | 'creadoEn'>

export interface Repo {
  modo: 'prueba' | 'supabase'
  catalogo(): Promise<DatosCatalogo>

  pedidos(filtro?: FiltroPedidos): Promise<Pedido[]>
  pedidoPorCodigo(codigo: string): Promise<Pedido | null>
  /** El código EH-0001 lo asigna el almacenamiento. */
  crearPedido(p: PedidoNuevo): Promise<{ codigo: string }>
  cambiarEstadoPedido(codigo: string, estado: EstadoPedido): Promise<void>

  /** Crea o actualiza. Lanza ErrorNegocio si ya hay otro drop abierto. */
  guardarDrop(d: Drop): Promise<void>
  crearEquipo(e: Equipo): Promise<void>
  guardarProducto(p: Producto): Promise<void>
  guardarTipo(t: TipoPrenda): Promise<void>
  guardarCombo(c: Combo): Promise<void>
  guardarParche(p: Parche): Promise<void>
  guardarAjustes(a: Ajustes): Promise<void>

  registrarEvento(e: EventoGuardado): Promise<void>
  eventos(desde: number, hasta: number): Promise<EventoGuardado[]>

  /** Límites contra abuso: cuántas veces pasó «clave» desde «desde» (ms). */
  contarIntentos(clave: string, desde: number): Promise<number>
  registrarIntento(clave: string): Promise<void>

  /** Devuelve la URL pública de la foto. */
  subirFoto(ruta: string, datos: Uint8Array): Promise<string>

  /** Mantiene despierta la base (Supabase pausa tras 7 días sin uso). */
  ping(): Promise<void>
  reiniciar(): Promise<void>
}

/** Error que se puede mostrar tal cual al usuario del admin. */
export class ErrorNegocio extends Error {}
