import { requerirAdmin } from '@/lib/auth/sesion'
import type { Metadata } from 'next'
import { WhatsappLogo } from '@phosphor-icons/react/dist/ssr'
import { CircleCheck, FileSpreadsheet, Package, Shirt } from 'lucide-react'
import Link from 'next/link'
import { estadoPedidoAccion } from '@/app/admin/acciones'
import { ESTADO_PEDIDO, ESTADOS_PEDIDO } from '@/components/admin/estados'
import { fechaYHora } from '@/components/admin/fechas'
import { SelectorDrop } from '@/components/admin/SelectorDrop'
import { Card, Chip, PageHeader, boton } from '@/components/admin/ui'
import { listarDrops, listarPedidos } from '@/lib/data/admin'
import { describirDorsal } from '@/lib/data/tienda'
import { formatoPrecio } from '@/lib/domain/pricing'
import type { EstadoPedido, Pedido } from '@/lib/domain/types'

export const metadata: Metadata = { title: 'Pedidos' }

type Params = Promise<{ drop?: string; estado?: string; codigo?: string }>

const prendas = (p: Pedido) => p.items.reduce((s, i) => s + i.cantidad * (i.comboId ? 2 : 1), 0) || 1

function BotonEstado({ codigo, estado, children, className }: { codigo: string; estado: EstadoPedido; children: React.ReactNode; className: string }) {
  return (
    <form action={estadoPedidoAccion}>
      <input type="hidden" name="codigo" value={codigo} />
      <input type="hidden" name="estado" value={estado} />
      <button type="submit" className={`${className} w-full`}>{children}</button>
    </form>
  )
}

function Detalle({ pedido, drop }: { pedido: Pedido; drop: string }) {
  const saldo = Math.max(0, pedido.total - pedido.reserva)
  const chat = `https://wa.me/${pedido.clienteWhatsapp.replace(/\D/g, '')}`
  return (
    <Card className="overflow-hidden">
      <div className="space-y-1.5 bg-navy-950 p-5 text-white">
        <div className="flex justify-between gap-3">
          <p className="kicker text-[10px] text-sky">#{pedido.codigo} · {drop}</p>
          <p className="kicker text-[10px] text-muted">{fechaYHora(pedido.creadoEn)}</p>
        </div>
        <p className="display text-[28px]">{pedido.clienteNombre}</p>
        <p className="text-[13px] text-[#d6def0]">{pedido.sector} · {pedido.clienteWhatsapp}</p>
      </div>

      <ul className="px-5 py-2">
        {pedido.items.length === 0 && <li className="py-3 text-sm text-ink-soft">Sin detalle de prendas en los datos de prueba.</li>}
        {pedido.items.map(i => {
          const dorsal = describirDorsal(i)
          return (
            <li key={i.id} className="flex gap-3 border-b border-line-dark py-3 last:border-0">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-[13px] font-semibold">{i.cantidad > 1 && `${i.cantidad}× `}{i.descripcion}</p>
                <p className="text-xs text-ink-soft">{i.detalle}</p>
                {dorsal ? (
                  <p className="inline-flex items-center gap-1.5 bg-navy-950 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-sky">
                    <Shirt size={11} aria-hidden /> {dorsal.replaceAll(' + ', ' · ').replaceAll('#', '')}
                  </p>
                ) : (
                  <p className="text-xs text-[#8a97b8]">Sin personalizar</p>
                )}
              </div>
              <p className="display text-base">{formatoPrecio(i.subtotal)}</p>
            </li>
          )
        })}
      </ul>

      <dl className="space-y-1.5 border-t border-line-dark px-5 py-3">
        <div className="flex items-center justify-between"><dt className="text-[15px] font-bold">Total</dt><dd className="display text-2xl">{formatoPrecio(pedido.total)}</dd></div>
        <div className="flex justify-between text-[13px] text-ink-soft"><dt>Reserva para confirmar</dt><dd className="font-semibold text-navy-950">{formatoPrecio(pedido.reserva)}</dd></div>
        <div className="flex justify-between text-[13px] text-ink-soft"><dt>Saldo (lo coordinas por chat)</dt><dd className="font-semibold text-navy-950">{formatoPrecio(saldo)}</dd></div>
      </dl>

      <div className="space-y-2 px-5 pb-5 pt-2">
        {pedido.estado === 'por_confirmar' && (
          <BotonEstado codigo={pedido.codigo} estado="reserva_pagada" className={boton.oscuro}>
            <CircleCheck size={16} className="text-sky" aria-hidden /> Marcar reserva pagada ({formatoPrecio(pedido.reserva)})
          </BotonEstado>
        )}
        {pedido.estado === 'reserva_pagada' && (
          <BotonEstado codigo={pedido.codigo} estado="pagado" className={boton.oscuro}>
            <CircleCheck size={16} className="text-sky" aria-hidden /> Marcar pagado completo
          </BotonEstado>
        )}
        <a href={chat} target="_blank" rel="noopener noreferrer" className={`${boton.whatsapp} w-full`}>
          <WhatsappLogo size={16} weight="fill" aria-hidden /> Abrir chat con {pedido.clienteNombre.split(' ')[0]}
        </a>
        {pedido.estado !== 'entregado' && pedido.estado !== 'cancelado' && (
          <BotonEstado codigo={pedido.codigo} estado="entregado" className={boton.claro}>
            <Package size={16} aria-hidden /> Marcar como entregado
          </BotonEstado>
        )}
        {pedido.estado === 'por_confirmar' && (
          <BotonEstado codigo={pedido.codigo} estado="cancelado" className="text-xs font-semibold text-red-700 underline-offset-2 hover:underline">
            Cancelar pedido
          </BotonEstado>
        )}
      </div>
    </Card>
  )
}

export default async function PedidosPage({ searchParams }: { searchParams: Params }) {
  // El layout no basta: Next genera la página en paralelo. Se verifica aquí también.
  await requerirAdmin()
  const sp = await searchParams
  const drops = await listarDrops()
  const drop = drops.find(d => d.id === sp.drop) ?? drops.find(d => d.estado === 'abierto') ?? drops[0]
  const delDrop = drop ? await listarPedidos({ dropId: drop.id }) : []
  const estado = ESTADOS_PEDIDO.find(e => e === sp.estado)
  const visibles = estado ? delDrop.filter(p => p.estado === estado) : delDrop
  const seleccionado = visibles.find(p => p.codigo === sp.codigo) ?? visibles[0]

  const url = (cambios: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    const todo = { drop: drop?.id, estado, codigo: sp.codigo, ...cambios }
    for (const [k, v] of Object.entries(todo)) if (v) p.set(k, v)
    return `/admin/pedidos?${p}`
  }

  return (
    <>
      <PageHeader titulo="Pedidos" subtitulo="Cada «Enviar por WhatsApp» queda guardado aquí. Tú marcas la reserva y el pago.">
        {drop && <SelectorDrop drops={drops.map(d => ({ id: d.id, nombre: d.nombre }))} actual={drop.id} />}
        {drop && (
          <Link href={`/admin/pedidos/export?drop=${drop.id}`} prefetch={false} className={boton.oscuro}>
            <FileSpreadsheet size={16} className="text-sky" aria-hidden /> Lista para el proveedor
          </Link>
        )}
      </PageHeader>

      <nav aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
        {[undefined, ...ESTADOS_PEDIDO].map(e => {
          const activo = e === estado
          const n = e ? delDrop.filter(p => p.estado === e).length : delDrop.length
          return (
            <Link
              key={e ?? 'todos'}
              href={url({ estado: e, codigo: undefined })}
              aria-current={activo ? 'page' : undefined}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-semibold ${activo ? 'border-navy-950 bg-navy-950 text-white' : 'border-line-dark bg-white'}`}
            >
              {e ? ESTADO_PEDIDO[e].label : 'Todos'}
              <span className={`rounded-full px-1.5 text-[11px] font-bold ${activo ? 'bg-sky text-navy-950' : 'bg-admin-bg'}`}>{n}</span>
            </Link>
          )
        })}
      </nav>

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#f8fafd] text-left">
              <tr className="kicker text-[10px] text-ink-soft">
                <th className="px-5 py-2.5 font-normal">Pedido</th>
                <th className="px-3 py-2.5 font-normal">Cliente</th>
                <th className="px-3 py-2.5 font-normal">Prendas</th>
                <th className="px-3 py-2.5 font-normal">Total</th>
                <th className="px-5 py-2.5 font-normal">Estado</th>
              </tr>
            </thead>
            <tbody>
              {visibles.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-ink-soft">No hay pedidos con este filtro.</td></tr>
              )}
              {visibles.map(p => {
                const activo = p.codigo === seleccionado?.codigo
                return (
                  <tr key={p.codigo} className={`border-b border-line-dark last:border-0 ${activo ? 'bg-[#f3f8fe]' : 'hover:bg-[#f8fafd]'}`}>
                    <td className="px-5 py-3">
                      <Link href={url({ codigo: p.codigo })} scroll={false} className="font-mono text-xs font-bold">
                        #{p.codigo}
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <Link href={url({ codigo: p.codigo })} scroll={false} className="flex flex-col">
                        <span className="font-semibold">{p.clienteNombre}</span>
                        <span className="text-xs text-ink-soft">{p.sector}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-3">{prendas(p)}</td>
                    <td className="display px-3 py-3 text-lg">{formatoPrecio(p.total)}</td>
                    <td className="px-5 py-3"><Chip clase={ESTADO_PEDIDO[p.estado].clase}>{ESTADO_PEDIDO[p.estado].label}</Chip></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>

        {seleccionado && drop && <Detalle pedido={seleccionado} drop={drop.nombre} />}
      </div>
    </>
  )
}
