'use client'

import { Minus, Plus, Shirt, TimerOff, X } from 'lucide-react'
import { InstagramLogo, WhatsappLogo } from '@phosphor-icons/react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState, useTransition } from 'react'
import { enviarPedido } from '@/app/(tienda)/acciones'
import { articulosCarrito, totalCarrito, useCarrito } from '@/lib/cart/store'
import { formatoPrecio } from '@/lib/domain/pricing'

interface Props {
  dropNombre: string | null
  llegaEntre: string | null
  montoReserva: number
  instagram: string
}

export function CarritoPanel({ dropNombre, llegaEntre, montoReserva, instagram }: Props) {
  const { lineas, abierto, cerrar, cambiarCantidad, quitar, vaciar } = useCarrito()
  const [datos, setDatos] = useState({ cliente: '', whatsapp: '', sector: '' })
  const [error, setError] = useState<string | null>(null)
  const [enviado, setEnviado] = useState<{ codigo: string; url: string } | null>(null)
  const [pendiente, iniciar] = useTransition()
  const panel = useRef<HTMLDivElement>(null)

  const abiertoDrop = dropNombre !== null
  const total = totalCarrito(lineas)
  const n = articulosCarrito(lineas)

  useEffect(() => {
    if (!abierto) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && cerrar()
    document.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    panel.current?.focus()
    return () => {
      document.removeEventListener('keydown', esc)
      document.body.style.overflow = ''
    }
  }, [abierto, cerrar])

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    iniciar(async () => {
      const r = await enviarPedido({
        ...datos,
        lineas: lineas.map(({ key, productoId, comboId, talla, cantidad, personalizacion }) => ({ key, productoId, comboId, talla, cantidad, personalizacion })),
      })
      if (!r.ok) return setError(r.error)
      setEnviado({ codigo: r.codigo, url: r.whatsappUrl })
      vaciar()
      window.location.assign(r.whatsappUrl)
    })
  }

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="titulo-carrito">
      <button type="button" aria-label="Cerrar carrito" onClick={cerrar} className="absolute inset-0 bg-navy-950/70 backdrop-blur-sm" />
      <div ref={panel} tabIndex={-1} className="relative flex h-full w-full max-w-[520px] flex-col bg-white text-navy-950 outline-none">
        <div className="flex items-center justify-between border-b border-line-dark px-6 py-6 md:px-8">
          <div className="flex items-end gap-3">
            <h2 id="titulo-carrito" className="display text-4xl">Tu carrito</h2>
            {abiertoDrop && n > 0 && <span className="kicker mb-1 text-[11px] text-navy-700">{n} {n === 1 ? 'artículo' : 'artículos'} · {dropNombre}</span>}
          </div>
          <button type="button" onClick={cerrar} aria-label="Cerrar"><X size={24} /></button>
        </div>

        {enviado ? (
          <Enviado codigo={enviado.codigo} url={enviado.url} onCerrar={() => { setEnviado(null); cerrar() }} />
        ) : !abiertoDrop ? (
          <EnPausa instagram={instagram} onCerrar={cerrar} />
        ) : lineas.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="display text-3xl">Tu carrito está vacío</p>
            <p className="text-ink-soft">Elige tu liga, tu equipo y ponle tu nombre.</p>
            <Link href="/vitrina" onClick={cerrar} className="kicker bg-navy-950 px-6 py-4 font-bold text-white">Ver la vitrina</Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-6 md:px-8">
              {lineas.map(l => (
                <li key={l.key} className="flex gap-4 border-b border-line-dark py-5">
                  <Image src={l.foto} alt="" width={84} height={104} className="h-[104px] w-[84px] shrink-0 bg-sky-soft object-cover" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex justify-between gap-3">
                      <p className="font-bold">{l.titulo}</p>
                      <p className="display text-2xl">{formatoPrecio(l.unitario * l.cantidad)}</p>
                    </div>
                    <p className="text-[13px] text-ink-soft">{l.detalle}</p>
                    {l.dorsal && (
                      <p className="flex w-fit items-center gap-1.5 bg-navy-950 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-sky">
                        <Shirt size={12} aria-hidden /> {l.dorsal}
                      </p>
                    )}
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-center gap-3.5 border border-navy-950/20 px-3 py-1.5">
                        <button type="button" onClick={() => cambiarCantidad(l.key, -1)} aria-label="Quitar uno"><Minus size={14} /></button>
                        <span className="w-4 text-center text-sm font-bold" aria-live="polite">{l.cantidad}</span>
                        <button type="button" onClick={() => cambiarCantidad(l.key, 1)} aria-label="Agregar uno"><Plus size={14} /></button>
                      </div>
                      <button type="button" onClick={() => quitar(l.key)} className="text-[13px] text-ink-soft underline">Quitar</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <form onSubmit={enviar} className="space-y-4 bg-sky-soft px-6 py-6 md:px-8">
              <div className="grid grid-cols-2 gap-2.5">
                <Campo etiqueta="Tu nombre" valor={datos.cliente} onChange={v => setDatos({ ...datos, cliente: v })} autoComplete="given-name" />
                <Campo etiqueta="Tu WhatsApp" valor={datos.whatsapp} onChange={v => setDatos({ ...datos, whatsapp: v })} autoComplete="tel" tipo="tel" placeholder="09…" />
                <div className="col-span-2">
                  <Campo etiqueta="Sector de entrega" valor={datos.sector} onChange={v => setDatos({ ...datos, sector: v })} placeholder="Ej. Cdla. Las Brisas, Machala" />
                </div>
              </div>
              <div className="space-y-1 text-[13px] text-ink-soft">
                <p className="flex justify-between"><span>Reserva para confirmar</span><span className="font-semibold">{formatoPrecio(montoReserva)}</span></p>
                <p className="flex justify-between"><span>Saldo (lo coordinas por chat)</span><span className="font-semibold">{formatoPrecio(Math.max(0, total - montoReserva))}</span></p>
              </div>
              <div className="flex items-end justify-between">
                <span className="kicker">Total a confirmar</span>
                <span className="display text-5xl">{formatoPrecio(total)}</span>
              </div>
              {error && <p role="alert" className="bg-red-100 px-3 py-2 text-sm text-red-800">{error}</p>}
              <button type="submit" disabled={pendiente} className="kicker flex h-16 w-full items-center justify-center gap-3 bg-whatsapp font-bold text-navy-950 transition hover:brightness-95 disabled:opacity-60">
                <WhatsappLogo size={24} weight="fill" aria-hidden />
                {pendiente ? 'Preparando tu pedido…' : 'Enviar pedido por WhatsApp'}
              </button>
              <p className="text-center text-xs leading-relaxed text-ink-soft">
                No pagas aquí. Por WhatsApp te pasamos los datos para la reserva de {formatoPrecio(montoReserva)}.
                {llegaEntre && ` Llega entre el ${llegaEntre}.`}
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

function Campo({ etiqueta, valor, onChange, tipo = 'text', placeholder, autoComplete }: {
  etiqueta: string; valor: string; onChange: (v: string) => void; tipo?: string; placeholder?: string; autoComplete?: string
}) {
  return (
    <label className="block space-y-1.5">
      <span className="kicker text-[10px] text-navy-700">{etiqueta}</span>
      <input
        required
        type={tipo}
        value={valor}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-navy-950/15 bg-white px-3.5 py-3 text-[15px] outline-none focus:border-navy-700"
      />
    </label>
  )
}

function EnPausa({ instagram, onCerrar }: { instagram: string; onCerrar: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
      <div className="grid size-[72px] place-items-center rounded-full bg-sky-soft text-navy-800"><TimerOff size={32} aria-hidden /></div>
      <p className="display text-4xl">Carrito en pausa</p>
      <p className="text-[15px] leading-relaxed text-ink-soft">Ningún drop disponible por ahora. Pronto realizaremos otro drop y podrás armar tu pedido.</p>
      <Link href="/vitrina" onClick={onCerrar} className="kicker flex h-14 w-full items-center justify-center bg-navy-950 font-bold text-white">Seguir viendo la vitrina</Link>
      <a href={`https://instagram.com/${instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="kicker flex h-14 w-full items-center justify-center gap-2 border border-navy-950/20 font-bold">
        <InstagramLogo size={18} aria-hidden /> Síguenos para enterarte
      </a>
    </div>
  )
}

function Enviado({ codigo, url, onCerrar }: { codigo: string; url: string; onCerrar: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
      <p className="kicker text-navy-700">Pedido #{codigo}</p>
      <p className="display text-4xl">¡Listo, hincha!</p>
      <p className="text-[15px] leading-relaxed text-ink-soft">Se abrió WhatsApp con tu pedido. Si no se abrió, tócalo aquí y envía el mensaje para confirmarlo.</p>
      <a href={url} className="kicker flex h-14 w-full items-center justify-center gap-2 bg-whatsapp font-bold"><WhatsappLogo size={20} weight="fill" aria-hidden /> Abrir WhatsApp</a>
      <button type="button" onClick={onCerrar} className="text-sm underline">Volver a la tienda</button>
    </div>
  )
}
