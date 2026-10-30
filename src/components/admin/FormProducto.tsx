'use client'

import { ArrowLeft, Check, Lock, Plus, Send } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useState } from 'react'
import { guardarProductoAccion } from '@/app/admin/acciones'
import { formatoPrecio } from '@/lib/domain/pricing'
import type { Equipo, Liga, Parche, Producto, TipoPrenda } from '@/lib/domain/types'
import { SubidaFotos } from './SubidaFotos'
import { Aviso, Campo, Interruptor, input } from './ui'

interface Props {
  ligas: Liga[]
  equipos: Equipo[]
  tipos: TipoPrenda[]
  parches: Parche[]
  producto: Producto | null
  /** Con Supabase configurado se pueden subir fotos. */
  subirFotos: boolean
}

const tarjeta = 'space-y-4 rounded-2xl border border-line-dark bg-white p-5'

export function FormProducto({ ligas, equipos, tipos, parches, producto, subirFotos }: Props) {
  const [estado, enviar, pendiente] = useActionState(guardarProductoAccion, null)

  const equipoInicial = equipos.find(e => e.id === producto?.equipoId)
  const [ligaId, setLigaId] = useState(equipoInicial?.ligaId ?? ligas[0]?.id ?? '')
  const deLiga = equipos.filter(e => e.ligaId === ligaId)
  const [equipoId, setEquipoId] = useState(equipoInicial?.id ?? deLiga[0]?.id ?? '')
  const [tipoId, setTipoId] = useState(producto?.tipoId ?? tipos[0]?.id ?? '')
  const [nombre, setNombre] = useState(producto?.nombre ?? '')
  const [especial, setEspecial] = useState(producto?.precioEspecial?.toString() ?? '')
  const [elegidos, setElegidos] = useState<string[]>(producto?.parchesPermitidos ?? [])

  const tipo = tipos.find(t => t.id === tipoId)
  const liga = ligas.find(l => l.id === ligaId)
  const equipo = equipos.find(e => e.id === equipoId)
  const precio = Number(especial) > 0 ? Number(especial) : tipo?.precio ?? 0
  const nombresParches = parches.filter(p => elegidos.includes(p.id)).map(p => p.nombre)

  const alternar = (id: string) => setElegidos(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]))

  return (
    <form action={enviar} className="space-y-5">
      {producto && <input type="hidden" name="id" value={producto.id} />}
      <input type="hidden" name="tipoId" value={tipoId} />
      {elegidos.map(id => <input key={id} type="hidden" name="parches" value={id} />)}

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/admin/productos" className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft hover:text-navy-950">
            <ArrowLeft size={14} aria-hidden /> Productos
          </Link>
          <h1 className="display text-[40px] text-navy-950">{producto ? 'Editar camiseta' : 'Nueva camiseta'}</h1>
        </div>
        <div className="flex gap-2.5">
          <button type="submit" name="modo" value="borrador" disabled={pendiente} className="rounded-lg border border-navy-950/15 bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50">
            Guardar borrador
          </button>
          <button type="submit" name="modo" value="publicar" disabled={pendiente} className="inline-flex items-center gap-2 rounded-lg bg-navy-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            <Send size={15} className="text-sky" aria-hidden /> {pendiente ? 'Guardando…' : 'Publicar en la vitrina'}
          </button>
        </div>
      </header>

      {estado?.error && <Aviso tipo="error">{estado.error}</Aviso>}

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="min-w-0 space-y-5">
          <section className={tarjeta}>
            <h2 className="text-base font-bold">1. ¿Dónde aparece?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo label="Liga">
                <select value={ligaId} onChange={e => { setLigaId(e.target.value); setEquipoId(equipos.find(x => x.ligaId === e.target.value)?.id ?? '') }} className={input}>
                  {ligas.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                </select>
              </Campo>
              <Campo label="Equipo">
                <select name="equipoId" value={equipoId} onChange={e => setEquipoId(e.target.value)} className={input} required>
                  {deLiga.length === 0 && <option value="">Esta liga no tiene equipos</option>}
                  {deLiga.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </Campo>
            </div>
            <Campo label="Nombre de la opción">
              <input name="nombre" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Local 25/26" required maxLength={60} className={input} />
            </Campo>
          </section>

          <section className={tarjeta}>
            <h2 className="text-base font-bold">2. Tipo y precio</h2>
            <div role="radiogroup" aria-label="Tipo de prenda" className="grid grid-cols-3 gap-2 lg:grid-cols-6">
              {tipos.map(t => {
                const activo = t.id === tipoId
                return (
                  <button key={t.id} type="button" role="radio" aria-checked={activo} onClick={() => setTipoId(t.id)}
                    className={`flex flex-col items-start gap-0.5 rounded-xl border p-2.5 text-left ${activo ? 'border-navy-950 bg-navy-950 text-white' : 'border-line-dark bg-[#f8fafd]'}`}>
                    <span className="text-xs font-semibold leading-tight">{t.nombre}</span>
                    <span className={`display text-xl ${activo ? 'text-sky' : ''}`}>{formatoPrecio(t.precio)}</span>
                  </button>
                )
              })}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo label="Precio (del tipo)">
                <span className={`${input} flex items-center justify-between bg-[#eef3fa] font-bold`}>
                  {formatoPrecio(tipo?.precio ?? 0)} <Lock size={15} className="text-ink-soft" aria-hidden />
                </span>
              </Campo>
              <Campo label="Precio especial (opcional)">
                <input name="precioEspecial" type="number" min={1} step="0.5" value={especial} onChange={e => setEspecial(e.target.value)} placeholder="Ej. 45" className={input} />
              </Campo>
            </div>
          </section>

          <section className={tarjeta}>
            <h2 className="text-base font-bold">3. Personalización</h2>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Nombre y número gratis</p>
                <p className="text-xs text-ink-soft">
                  {tipo?.aceptaPersonalizacion
                    ? `Hasta 10 letras. Viene activado por el tipo ${tipo.nombre}.`
                    : `El tipo ${tipo?.nombre ?? ''} no lleva nombre ni número. Se cambia en Precios y combos.`}
                </p>
              </div>
              <span className={`mt-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${tipo?.aceptaPersonalizacion ? 'bg-navy-950 text-sky' : 'bg-slate-100 text-slate-500'}`}>
                {tipo?.aceptaPersonalizacion ? 'ACTIVO' : 'NO APLICA'}
              </span>
            </div>
            <fieldset className="space-y-2">
              <legend className="kicker text-[10px] text-ink-soft">Parches permitidos · {formatoPrecio(parches[0]?.precio ?? 1)} c/u</legend>
              <div className="flex flex-wrap gap-2">
                {parches.map(p => {
                  const activo = elegidos.includes(p.id)
                  return (
                    <button key={p.id} type="button" aria-pressed={activo} onClick={() => alternar(p.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold ${activo ? 'border-navy-800 bg-sky-soft text-navy-800' : 'border-line-dark bg-[#f8fafd] text-ink-soft'}`}>
                      {activo ? <Check size={13} aria-hidden /> : <Plus size={13} aria-hidden />} {p.nombre}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          </section>
        </div>

        <div className="space-y-5">
          <section className={tarjeta}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">4. Fotos</h2>
              <span className="kicker text-[10px] text-ink-soft">{producto?.fotos.length ?? 0} / 6</span>
            </div>
            <SubidaFotos productoId={producto?.id ?? null} fotos={producto?.fotos ?? []} habilitada={subirFotos} />
          </section>

          <section className={tarjeta}>
            <h2 className="text-base font-bold">5. Visibilidad</h2>
            <Interruptor name="visible" defaultChecked={producto?.visible ?? true} label="Visible en la vitrina" />
            <Interruptor name="destacado" defaultChecked={producto?.destacado ?? false} label="Destacar en portada" ayuda="Aparece primero en su liga" />
          </section>

          <section className="space-y-1.5 rounded-xl bg-navy-950 p-4 text-white">
            <p className="kicker text-[10px] text-sky">Así se verá en la web</p>
            <p className="text-[13px] text-[#d6def0]">{liga?.nombre} › {equipo?.nombre ?? '—'} › {nombre || '…'}</p>
            <p className="display text-[22px]">{tipo?.nombre} · {formatoPrecio(precio)}</p>
            <p className="text-xs text-muted">
              {tipo?.aceptaPersonalizacion ? 'Nombre y número gratis' : 'Sin personalización'}
              {nombresParches.length > 0 && ` · Parches ${nombresParches.join(' / ')} +${formatoPrecio(parches[0]?.precio ?? 1)}`}
            </p>
          </section>
        </div>
      </div>
    </form>
  )
}
