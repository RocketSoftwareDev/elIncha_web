'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Check, Lock, MapPin, Minus, Package, Plus, Shirt, ShoppingBag, Timer, Zap } from 'lucide-react'
import { MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { VistaPreviaCamiseta, VistaPreviaShort } from '@/components/dorsal/VistaPreviaDorsal'
import { useCarrito } from '@/lib/cart/store'
import { MAX_NOMBRE, MENSAJE_ERROR, largo, normalizarNombre, normalizarNumero, validarNombre } from '@/lib/domain/dorsal'
import { Precio } from '@/components/Precio'
import { formatoPrecio } from '@/lib/domain/pricing'
import type { ProductoVista } from '@/lib/domain/types'
import { CuentaRegresivaCorta } from './CuentaRegresivaCorta'
import { useDorsal } from './producto/DorsalContexto'
import { registrar } from '@/lib/analitica/registrar'

interface ShortOferta { id: string; nombre: string; foto: string; extra: number; tallas: string[] }
interface ComboOferta { id: string; nombre: string; precio: number; precioSuelto: number; shorts: ShortOferta[] }
interface DropInfo { nombre: string; pideHasta: string; llegaEntre: string; cierraEn: string }

export function Configurador({ producto: p, combo, drop, inicioInmediata, guiaTallas = null }: {
  producto: ProductoVista; combo: ComboOferta | null; drop: DropInfo | null; inicioInmediata: boolean; guiaTallas?: string | null
}) {
  const agregar = useCarrito(s => s.agregar)
  const { nombre, numero, personalizar, setNombre, setNumero, setPersonalizar } = useDorsal()
  const [talla, setTalla] = useState<string | null>(null)
  const [parches, setParches] = useState<string[]>([])
  const [conCombo, setConCombo] = useState(false)
  const [numeroShort, setNumeroShort] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [avisoTalla, setAvisoTalla] = useState(false)
  const [sinSponsors, setSinSponsors] = useState(false)
  // Combo: pantaloneta y su talla (puede ser distinta a la de la camiseta).
  const [shortId, setShortId] = useState<string | null>(combo?.shorts[0]?.id ?? null)
  const [tallaShort, setTallaShort] = useState<string | null>(null)
  const [avisoShort, setAvisoShort] = useState(false)
  const short = combo?.shorts.find(s => s.id === shortId)
  // Sobrantes listos para entregar: se venden sin drop, pero no se personalizan.
  const hayStock = p.stock.length > 0
  const [inmediata, setInmediata] = useState(inicioInmediata)
  const sobrante = inmediata ? p.stock.find(s => s.talla === talla) : undefined
  const maxCantidad = inmediata ? (sobrante?.cantidad ?? 1) : 10

  const errorNombre = inmediata ? null : validarNombre(nombre)
  const extraParches = parches.reduce((s, id) => s + (p.parches.find(x => x.id === id)?.precio ?? 0), 0)
  const precioStock = sobrante?.precio ?? Math.min(...p.stock.map(s => s.precio))
  const enCombo = !inmediata && conCombo && !!combo
  const unitario = inmediata ? precioStock : (enCombo ? combo!.precio + (short?.extra ?? 0) : p.precio) + extraParches
  const titulo = `${p.equipo.nombre} ${p.nombre}`
  const puedeAgregar = inmediata || !!drop

  function cambiarModo(v: boolean) {
    setInmediata(v)
    setTalla(null)
    setCantidad(1)
    setParches([])
    setConCombo(false)
    setSinSponsors(false)
    setPersonalizar(!v && p.tipo.aceptaPersonalizacion)
  }

  function elegirShort(id: string) {
    setShortId(id)
    setAvisoShort(false)
    // Si la talla elegida no existe en esta pantaloneta, se vuelve a pedir.
    if (tallaShort && !combo?.shorts.find(s => s.id === id)?.tallas.includes(tallaShort)) setTallaShort(null)
  }

  function elegirTalla(t: string) {
    setTalla(t)
    setAvisoTalla(false)
    if (inmediata) setCantidad(c => Math.min(c, p.stock.find(s => s.talla === t)?.cantidad ?? 1))
  }

  function alternarParche(id: string) {
    setParches(ps => (ps.includes(id) ? ps.filter(x => x !== id) : [...ps, id]))
  }

  function agregarAlCarrito() {
    if (!talla) return setAvisoTalla(true)
    if (inmediata) {
      if (!sobrante) return setAvisoTalla(true)
      registrar({ tipo: 'agregar_carrito', ruta: `/producto/${p.slug}`, productoId: p.id })
      return agregar({
        productoId: p.id,
        comboId: null,
        stockId: sobrante.id,
        shortId: null,
        tallaShort: '',
        talla,
        cantidad: Math.min(cantidad, sobrante.cantidad),
        max: sobrante.cantidad,
        personalizacion: { nombre: '', numero: '', numeroShort: '', parches: [], sinSponsors: false },
        titulo,
        detalle: `${p.tipo.nombre} · Talla ${talla} · Entrega inmediata`,
        foto: p.fotos[0],
        unitario: sobrante.precio,
        dorsal: null,
      })
    }
    if (errorNombre) return
    if (enCombo && (!short || !tallaShort)) return setAvisoShort(true)
    const n = personalizar ? nombre.trim() : ''
    const num = personalizar ? numero : ''
    const nShort = enCombo ? numeroShort : ''
    const nombresParches = parches.map(id => p.parches.find(x => x.id === id)?.nombre).filter(Boolean)
    const dorsal = [
      [n, num && `#${num}`].filter(Boolean).join(' '),
      nShort && `short #${nShort}`,
      ...nombresParches.map(x => `parche ${x}`),
    ].filter(Boolean).join(' · ')

    registrar({ tipo: 'agregar_carrito', ruta: `/producto/${p.slug}`, productoId: p.id })
    agregar({
      productoId: p.id,
      comboId: enCombo ? combo!.id : null,
      stockId: null,
      shortId: enCombo ? short!.id : null,
      tallaShort: enCombo ? tallaShort! : '',
      talla,
      cantidad,
      personalizacion: { nombre: n, numero: num, numeroShort: nShort, parches, sinSponsors },
      titulo: enCombo ? `Combo ${combo!.nombre}` : titulo,
      detalle: [
        enCombo ? `${titulo} + ${short!.nombre}` : p.tipo.nombre,
        `Talla ${talla}`,
        enCombo && `Short ${tallaShort}`,
        sinSponsors && 'Sin sponsors',
      ].filter(Boolean).join(' · '),
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
        <Precio valor={inmediata ? precioStock : p.precio} className="display text-5xl text-sky" />
        {inmediata
          ? precioStock < p.precio && <Precio valor={p.precio} tachado className="pb-1 text-[15px] text-muted" />
          : p.tipo.aceptaPersonalizacion && <p className="pb-1 text-[15px] text-muted">Nombre y número GRATIS</p>}
      </div>

      {hayStock && (
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Cómo la quieres">
          {[
            { v: false, titulo: 'Bajo pedido', sub: 'Con tu nombre y número' },
            { v: true, titulo: 'Entrega inmediata', sub: 'Lista ya · sin personalizar' },
          ].map(o => (
            <button
              key={o.titulo}
              type="button"
              role="radio"
              aria-checked={inmediata === o.v}
              onClick={() => cambiarModo(o.v)}
              className={`px-4 py-3 text-left transition ${inmediata === o.v ? 'bg-white text-navy-950' : 'border border-line hover:border-white'}`}
            >
              <span className="block text-[15px] font-bold">{o.titulo}</span>
              <span className={`block text-[12px] ${inmediata === o.v ? 'text-navy-700' : 'text-muted'}`}>{o.sub}</span>
            </button>
          ))}
        </div>
      )}

      {inmediata ? (
        <div className="flex items-center gap-3 border-l-[3px] border-whatsapp bg-whatsapp/10 px-4 py-3.5">
          <Zap size={20} className="shrink-0 text-whatsapp" aria-hidden />
          <div>
            <p className="text-sm font-bold">Entrega inmediata</p>
            <p className="text-[13px] text-muted">Ya la tenemos en Machala. Va tal cual, sin nombre, número ni parches.</p>
          </div>
        </div>
      ) : drop ? (
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
            <p className="text-[13px] text-muted">
              {hayStock ? 'Personalizada se pide en el próximo drop. Ahora mismo puedes llevarla en entrega inmediata.' : 'Pronto realizaremos otro drop. Puedes ver la camiseta, pero aún no pedirla.'}
            </p>
          </div>
        </div>
      )}

      <fieldset className="space-y-3">
        <div className="flex justify-between">
          <legend className="kicker">Talla</legend>
          <span className="flex items-center gap-3 text-[13px] text-muted">
            {inmediata ? 'Solo las tallas que tenemos' : 'Tallas de Ecuador'}
            {guiaTallas && <Link href={guiaTallas} className="text-sky underline underline-offset-2">Guía de tallas</Link>}
          </span>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {inmediata
            ? p.stock.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => elegirTalla(s.talla)}
                  aria-pressed={talla === s.talla}
                  className={`flex h-[52px] flex-col items-center justify-center font-bold transition ${talla === s.talla ? 'bg-white text-navy-950' : 'border border-line hover:border-white'}`}
                >
                  <span className="text-[15px]">{s.talla}</span>
                  <span className="text-[10px] font-semibold opacity-70">{s.cantidad === 1 ? 'última' : `quedan ${s.cantidad}`}</span>
                </button>
              ))
            : p.tipo.tallas.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => elegirTalla(t)}
                  aria-pressed={talla === t}
                  className={`h-[52px] text-[15px] font-bold transition ${talla === t ? 'bg-white text-navy-950' : 'border border-line hover:border-white'}`}
                >
                  {t}
                </button>
              ))}
        </div>
        {avisoTalla && <p role="alert" className="text-sm text-red-300">Elige una talla para continuar.</p>}
      </fieldset>

      {!inmediata && p.versionSinSponsors && (
        <fieldset className="space-y-2.5">
          <div className="flex justify-between">
            <legend className="text-[15px] font-bold">Patrocinadores (sponsors)</legend>
            <span className="kicker text-[11px] text-sky">Sin costo</span>
          </div>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Patrocinadores">
            {[
              { v: false, titulo: 'Con sponsors', sub: 'Como la usa el equipo' },
              { v: true, titulo: 'Sin sponsors', sub: 'Pecho limpio' },
            ].map(o => {
              const on = sinSponsors === o.v
              return (
                <button key={o.titulo} type="button" role="radio" aria-checked={on} onClick={() => setSinSponsors(o.v)}
                  className={`flex items-center gap-3 border px-3.5 py-3 text-left transition ${on ? 'border-sky bg-sky/10' : 'border-line hover:border-white'}`}>
                  <span className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${on ? 'border-sky' : 'border-muted'}`}>
                    {on && <span className="size-2.5 rounded-full bg-sky" />}
                  </span>
                  <span>
                    <span className="block text-sm font-bold">{o.titulo}</span>
                    <span className="block text-xs text-muted">{o.sub}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      {!inmediata && p.tipo.aceptaPersonalizacion && (
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
                <p className="kicker text-[11px] text-sky">Uno o varios · +{formatoPrecio(p.parches[0].precio)} c/u</p>
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
              {parches.length > 0 && (
                <p className="text-xs text-muted">
                  {parches.length} {parches.length === 1 ? 'elegido' : 'elegidos'} · {parches.map(id => p.parches.find(x => x.id === id)?.nombre).join(' + ')}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {!inmediata && combo && (
        <div className={`space-y-4 border p-4 transition ${conCombo ? 'border-sky bg-navy-800' : 'border-line bg-navy-900'}`}>
          <div className="flex items-center gap-3.5">
            <div className="flex-1">
              <p className="text-sm font-bold">{conCombo ? `Combo ${combo.nombre} · camiseta + short` : `Llévala en combo ${combo.nombre} (+ short)`}</p>
              <p className="flex items-center gap-2">
                <Precio valor={combo.precio} className="display text-[22px] text-sky" />
                {combo.precioSuelto > combo.precio && <Precio valor={combo.precioSuelto} tachado className="text-[13px] text-muted" />}
                <span className="kicker text-[10px] text-sky">Combo</span>
              </p>
            </div>
            <button type="button" aria-pressed={conCombo} onClick={() => setConCombo(v => !v)} className={`kicker px-3.5 py-2.5 text-[11px] font-bold ${conCombo ? 'bg-sky text-navy-950' : 'border border-white'}`}>
              {conCombo ? 'Elegido ✓' : 'Elegir combo'}
            </button>
          </div>

          {conCombo && (
            <div className="space-y-4 border-t border-line pt-4">
              <fieldset className="space-y-2.5">
                <div className="flex justify-between">
                  <legend className="text-[15px] font-bold">Elige tu pantaloneta</legend>
                  <span className="kicker text-[11px] text-sky">Obligatorio</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3" role="radiogroup" aria-label="Pantaloneta del combo">
                  {combo.shorts.map(s => {
                    const on = s.id === shortId
                    return (
                      <button key={s.id} type="button" role="radio" aria-checked={on} onClick={() => elegirShort(s.id)}
                        className={`space-y-2 p-2 text-left transition ${on ? 'border-2 border-sky bg-sky/10' : 'border border-line hover:border-white'}`}>
                        <span className="relative block aspect-[4/3] overflow-hidden bg-navy-900">
                          {s.foto && <Image src={s.foto} alt="" fill sizes="160px" className="object-contain" />}
                          {on && <span className="absolute left-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-sky text-navy-950"><Check size={12} aria-hidden /></span>}
                        </span>
                        <span className="block text-[13px] font-bold">{s.nombre}</span>
                        <span className="block text-[11px] font-bold text-sky">{s.extra > 0 ? `+${formatoPrecio(s.extra)}` : 'Incluido'}</span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              {short && (
                <fieldset className="space-y-2.5">
                  <div className="flex justify-between">
                    <legend className="text-[15px] font-bold">Talla del short</legend>
                    <span className="text-[12px] text-muted">Puede ser distinta a la camiseta</span>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {short.tallas.map(t => (
                      <button key={t} type="button" aria-pressed={tallaShort === t} onClick={() => { setTallaShort(t); setAvisoShort(false) }}
                        className={`h-11 text-sm font-bold transition ${tallaShort === t ? 'bg-white text-navy-950' : 'border border-line hover:border-white'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
              {avisoShort && <p role="alert" className="text-sm text-red-300">Elige la pantaloneta y su talla para continuar.</p>}

              <div className="flex items-center gap-4">
                <VistaPreviaShort numero={numeroShort} className="w-24 shrink-0" />
                <label className="flex-1 space-y-2">
                  <span className="kicker text-[11px] text-muted">Número del short (opcional)</span>
                  <input value={numeroShort} onChange={e => setNumeroShort(normalizarNumero(e.target.value))} inputMode="numeric" placeholder="10" className="display w-24 border border-line bg-navy-950 px-4 py-3 text-2xl outline-none focus:border-sky" />
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex h-[60px] items-center gap-5 border border-line px-[18px]">
          <button type="button" onClick={() => setCantidad(c => Math.max(1, c - 1))} aria-label="Quitar uno"><Minus size={16} /></button>
          <span className="w-4 text-center font-bold" aria-live="polite">{cantidad}</span>
          <button type="button" onClick={() => setCantidad(c => Math.min(maxCantidad, c + 1))} aria-label="Agregar uno"><Plus size={16} /></button>
        </div>
        {puedeAgregar ? (
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
        <li className="flex items-center gap-3">
          <Package size={18} className="text-sky" aria-hidden />
          {inmediata ? 'Entrega inmediata: la coordinamos apenas confirmes' : 'Bajo pedido: llega 20–30 días después del cierre del drop'}
        </li>
        <li className="flex items-center gap-3"><MessageCircle size={18} className="text-sky" aria-hidden /> Reservas con $5 por WhatsApp, el resto lo coordinamos contigo</li>
        <li className="flex items-center gap-3"><MapPin size={18} className="text-sky" aria-hidden /> Entrega en Machala y envíos a todo El Oro</li>
      </ul>
    </div>
  )
}
