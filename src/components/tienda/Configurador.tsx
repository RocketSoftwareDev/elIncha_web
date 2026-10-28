'use client'

import Image from 'next/image'
import { Check, Lock, MapPin, Minus, Package, Plus, Shirt, ShoppingBag, Timer } from 'lucide-react'
import { MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { VistaPreviaCamiseta, VistaPreviaShort } from '@/components/dorsal/VistaPreviaDorsal'
import { useCarrito } from '@/lib/cart/store'
import { MAX_NOMBRE, MENSAJE_ERROR, largo, normalizarNombre, normalizarNumero, validarNombre } from '@/lib/domain/dorsal'
import { formatoPrecio } from '@/lib/domain/pricing'
import type { ProductoVista } from '@/lib/domain/types'
import { CuentaRegresivaCorta } from './CuentaRegresivaCorta'
import { useDorsal } from './producto/DorsalContexto'

interface ComboOferta { id: string; nombre: string; precio: number; precioSuelto: number; fotoShort: string }
interface DropInfo { nombre: string; pideHasta: string; llegaEntre: string; cierraEn: string }

export function Configurador({ producto: p, combo, drop }: { producto: ProductoVista; combo: ComboOferta | null; drop: DropInfo | null }) {
  const agregar = useCarrito(s => s.agregar)
  const { nombre, numero, personalizar, setNombre, setNumero, setPersonalizar } = useDorsal()
  const [talla, setTalla] = useState<string | null>(null)
  const [parches, setParches] = useState<string[]>([])
  const [conCombo, setConCombo] = useState(false)
  const [numeroShort, setNumeroShort] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [avisoTalla, setAvisoTalla] = useState(false)

  const errorNombre = validarNombre(nombre)
  const extraParches = parches.reduce((s, id) => s + (p.parches.find(x => x.id === id)?.precio ?? 0), 0)
  const unitario = (conCombo && combo ? combo.precio : p.precio) + extraParches
  const titulo = `${p.equipo.nombre} ${p.nombre}`

  function alternarParche(id: string) {
    setParches(ps => (ps.includes(id) ? ps.filter(x => x !== id) : [...ps, id]))
  }

  function agregarAlCarrito() {
    if (!talla) return setAvisoTalla(true)
    if (errorNombre) return
    const n = personalizar ? nombre.trim() : ''
    const num = personalizar ? numero : ''
    const nShort = conCombo ? numeroShort : ''
    const nombresParches = parches.map(id => p.parches.find(x => x.id === id)?.nombre).filter(Boolean)
    const dorsal = [
      [n, num && `#${num}`].filter(Boolean).join(' '),
      nShort && `short #${nShort}`,
      ...nombresParches.map(x => `parche ${x}`),
    ].filter(Boolean).join(' · ')

    agregar({
      productoId: p.id,
      comboId: conCombo && combo ? combo.id : null,
      talla,
      cantidad,
      personalizacion: { nombre: n, numero: num, numeroShort: nShort, parches },
      titulo: conCombo && combo ? `Combo ${combo.nombre}` : titulo,
      detalle: conCombo && combo ? `${titulo} + Short · Talla ${talla}` : `${p.tipo.nombre} · Talla ${talla}`,
      foto: p.fotos[0],
      unitario,
      dorsal: dorsal || null,
    })
  }

  return (
    <div className="w-full space-y-7 lg:w-[540px]">
      <p className="kicker w-fit bg-sky px-2.5 py-1.5 text-[11px] font-bold text-navy-950">{p.liga.nombre} · {p.tipo.nombre}</p>
      <h1 className="display text-[clamp(48px,6vw,72px)] leading-[0.95]">{p.equipo.nombre}<br />{p.nombre}</h1>
      <div className="flex items-end gap-3.5">
        <p className="display text-5xl text-sky">{formatoPrecio(p.precio)}</p>
        {p.tipo.aceptaPersonalizacion && <p className="pb-1 text-[15px] text-muted">Nombre y número GRATIS</p>}
      </div>

      {drop ? (
        <div className="flex items-center gap-3 border-l-[3px] border-sky bg-sky/10 px-4 py-3.5">
          <Timer size={20} className="shrink-0 text-sky" aria-hidden />
          <div className="flex-1">
            <p className="text-sm font-bold">{drop.nombre} · pide hasta el {drop.pideHasta}</p>
            <p className="text-[13px] text-muted">Bajo pedido: llega entre el {drop.llegaEntre}</p>
          </div>
          <CuentaRegresivaCorta cierraEn={drop.cierraEn} />
        </div>
      ) : (
        <div className="flex items-center gap-3 border-l-[3px] border-red-400 bg-red-400/10 px-4 py-3.5">
          <Lock size={20} className="shrink-0 text-red-400" aria-hidden />
          <div>
            <p className="text-sm font-bold">No hay drop abierto</p>
            <p className="text-[13px] text-muted">Pronto realizaremos otro drop. Puedes ver la camiseta, pero aún no pedirla.</p>
          </div>
        </div>
      )}

      <fieldset className="space-y-3">
        <div className="flex justify-between">
          <legend className="kicker">Talla</legend>
          <span className="text-[13px] text-muted">Tallas de Ecuador</span>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {p.tipo.tallas.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => { setTalla(t); setAvisoTalla(false) }}
              aria-pressed={talla === t}
              className={`h-[52px] text-[15px] font-bold transition ${talla === t ? 'bg-white text-navy-950' : 'border border-line hover:border-white'}`}
            >
              {t}
            </button>
          ))}
        </div>
        {avisoTalla && <p role="alert" className="text-sm text-red-300">Elige una talla para continuar.</p>}
      </fieldset>

      {p.tipo.aceptaPersonalizacion && (
        <div className="space-y-4 border border-sky bg-navy-900 p-5 md:p-6">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2.5 text-[17px] font-bold"><Shirt size={20} className="text-sky" aria-hidden /> {p.tipo.esShort ? 'Número · gratis' : 'Nombre y número · gratis'}</p>
            <button
              type="button"
              role="switch"
              aria-checked={personalizar}
              aria-label="Personalizar con nombre y número"
              onClick={() => setPersonalizar(!personalizar)}
              className={`flex h-7 w-12 items-center rounded-full p-[3px] transition ${personalizar ? 'justify-end bg-sky' : 'justify-start bg-white/20'}`}
            >
              <span className="size-[22px] rounded-full bg-navy-950" />
            </button>
          </div>

          {personalizar && (
            <div className="flex flex-col gap-5 sm:flex-row">
              {/* En computadora la vista previa está en la galería; en celular queda a la vista aquí. */}
              <div className="mx-auto w-40 shrink-0 sm:mx-0 lg:hidden">
                {p.tipo.esShort ? <VistaPreviaShort numero={numero} className="w-full" /> : <VistaPreviaCamiseta nombre={nombre.trim()} numero={numero} className="w-full" />}
                <p className="kicker mt-1 text-center text-[9px] text-muted">Vista previa referencial</p>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex gap-3">
                  {!p.tipo.esShort && <label className="flex-1 space-y-2">
                    <span className="kicker text-[11px] text-muted">Nombre</span>
                    <input
                      value={nombre}
                      onChange={e => setNombre(normalizarNombre(e.target.value))}
                      maxLength={MAX_NOMBRE + 4}
                      aria-invalid={!!errorNombre}
                      aria-describedby="ayuda-nombre"
                      placeholder="VERA"
                      className="display w-full border border-line bg-navy-950 px-4 py-3.5 text-2xl tracking-wide outline-none placeholder:text-white/20 focus:border-sky"
                    />
                  </label>}
                  <label className="w-24 space-y-2">
                    <span className="kicker text-[11px] text-muted">Número</span>
                    <input
                      value={numero}
                      onChange={e => setNumero(normalizarNumero(e.target.value))}
                      inputMode="numeric"
                      placeholder="10"
                      className="display w-full border border-line bg-navy-950 px-4 py-3.5 text-2xl outline-none placeholder:text-white/20 focus:border-sky"
                    />
                  </label>
                </div>
                <p id="ayuda-nombre" className={`text-[13px] ${errorNombre ? 'text-red-300' : 'text-muted'}`}>
                  {p.tipo.esShort ? 'Número del 0 al 99. El short no lleva nombre.' : errorNombre ? MENSAJE_ERROR[errorNombre] : `${largo(nombre.trim())}/${MAX_NOMBRE} caracteres · Ñ, tildes y apóstrofe permitidos · número 0–99`}
                </p>
              </div>
            </div>
          )}

          {p.parches.length > 0 && (
            <div className="space-y-2.5 border-t border-line pt-3.5">
              <div className="flex justify-between">
                <p className="text-[15px] font-bold">Parches</p>
                <p className="kicker text-[11px] text-sky">+$1 c/u</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {p.parches.map(x => {
                  const on = parches.includes(x.id)
                  return (
                    <button key={x.id} type="button" aria-pressed={on} onClick={() => alternarParche(x.id)} className={`flex items-center gap-2 px-3 py-2 text-[13px] font-semibold transition ${on ? 'bg-sky text-navy-950' : 'border border-line hover:border-white'}`}>
                      {on ? <Check size={14} aria-hidden /> : <Plus size={14} aria-hidden />} {x.nombre}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {combo && (
        <div className={`space-y-4 border p-3.5 transition ${conCombo ? 'border-sky bg-navy-800' : 'border-line bg-navy-900'}`}>
          <div className="flex items-center gap-3.5">
            <Image src={combo.fotoShort} alt="" width={56} height={56} className="size-14 object-cover" />
            <div className="flex-1">
              <p className="text-sm font-bold">Llévala en combo {combo.nombre} (+ Short Player)</p>
              <p className="flex items-center gap-2">
                <span className="display text-[22px] text-sky">{formatoPrecio(combo.precio)}</span>
                <span className="text-[13px] text-muted line-through">{formatoPrecio(combo.precioSuelto)}</span>
                <span className="kicker text-[10px] text-sky">Combo</span>
              </p>
            </div>
            <button type="button" aria-pressed={conCombo} onClick={() => setConCombo(v => !v)} className={`kicker px-3.5 py-2.5 text-[11px] font-bold ${conCombo ? 'bg-sky text-navy-950' : 'border border-white'}`}>
              {conCombo ? 'Elegido ✓' : 'Elegir combo'}
            </button>
          </div>
          {conCombo && (
            <div className="flex items-center gap-4 border-t border-line pt-3.5">
              <VistaPreviaShort numero={numeroShort} className="w-28 shrink-0" />
              <label className="flex-1 space-y-2">
                <span className="kicker text-[11px] text-muted">Número del short (opcional)</span>
                <input value={numeroShort} onChange={e => setNumeroShort(normalizarNumero(e.target.value))} inputMode="numeric" placeholder="10" className="display w-24 border border-line bg-navy-950 px-4 py-3 text-2xl outline-none focus:border-sky" />
              </label>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex h-[60px] items-center gap-5 border border-line px-[18px]">
          <button type="button" onClick={() => setCantidad(c => Math.max(1, c - 1))} aria-label="Quitar uno"><Minus size={16} /></button>
          <span className="w-4 text-center font-bold" aria-live="polite">{cantidad}</span>
          <button type="button" onClick={() => setCantidad(c => Math.min(10, c + 1))} aria-label="Agregar uno"><Plus size={16} /></button>
        </div>
        {drop ? (
          <button type="button" onClick={agregarAlCarrito} disabled={!!errorNombre} className="kicker flex h-[60px] flex-1 items-center justify-center gap-2.5 bg-sky text-sm font-bold text-navy-950 transition hover:brightness-105 disabled:opacity-50">
            <ShoppingBag size={18} aria-hidden /> Agregar al carrito · {formatoPrecio(unitario * cantidad)}
          </button>
        ) : (
          <p className="kicker flex h-[60px] flex-1 items-center justify-center gap-2.5 bg-white/10 text-sm font-bold text-white/40">
            <Lock size={18} aria-hidden /> Carrito pausado
          </p>
        )}
      </div>

      <ul className="space-y-3 border-t border-line pt-5 text-sm text-[#d6def0]">
        <li className="flex items-center gap-3"><Package size={18} className="text-sky" aria-hidden /> Bajo pedido: llega 20–30 días después del cierre del drop</li>
        <li className="flex items-center gap-3"><MessageCircle size={18} className="text-sky" aria-hidden /> Reservas con $5 por WhatsApp, el resto lo coordinamos contigo</li>
        <li className="flex items-center gap-3"><MapPin size={18} className="text-sky" aria-hidden /> Entrega en Machala y envíos a todo El Oro</li>
      </ul>
    </div>
  )
}
