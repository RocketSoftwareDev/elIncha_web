import { requerirAdmin } from '@/lib/auth/sesion'
import type { Metadata } from 'next'
import { Pencil, Plus, Shield } from 'lucide-react'
import { crearComboAccion, crearParcheAccion, guardarPreciosAccion } from '@/app/admin/acciones'
import { CambiarImagen } from '@/components/admin/CambiarImagen'
import { BotonEnviar, FormAccion } from '@/components/admin/FormAccion'
import { FormShort, QuitarShort } from '@/components/admin/FormShort'
import { FormTipo, QuitarTipo } from '@/components/admin/FormTipo'
import { Card, CardHeader, PageHeader, boton, input } from '@/components/admin/ui'
import { listarCombos, listarParches, listarShorts, listarTipos, modoPrueba } from '@/lib/data/admin'
import { MAX_NOMBRE } from '@/lib/domain/dorsal'
import { formatoPrecio } from '@/lib/domain/pricing'
import type { Combo, TipoPrenda } from '@/lib/domain/types'

export const metadata: Metadata = { title: 'Precios y combos' }

// Los campos de precios están repartidos en varias tarjetas: se asocian al
// formulario de la cabecera con el atributo `form`, sin anidar formularios.
const FORM = 'form-precios'

function Interruptor({ name, checked, label }: { name: string; checked: boolean; label: string }) {
  return (
    <label className="inline-flex cursor-pointer">
      <span className="sr-only">{label}</span>
      <input form={FORM} type="checkbox" name={name} defaultChecked={checked} className="peer sr-only" />
      <span className="relative h-5 w-9 rounded-full bg-slate-300 transition peer-checked:bg-navy-950 peer-focus-visible:ring-2 peer-focus-visible:ring-sky after:absolute after:left-[3px] after:top-[3px] after:h-3.5 after:w-3.5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-4 peer-checked:after:bg-sky" />
    </label>
  )
}

function CampoPrecio({ name, valor, label }: { name: string; valor: number; label: string }) {
  return (
    <label className="flex w-24 items-center gap-1 rounded-lg border border-line-dark bg-admin-bg px-2.5 py-1.5 focus-within:border-navy-700 focus-within:bg-white">
      <span className="text-sm text-ink-soft">$</span>
      <span className="sr-only">{label}</span>
      <input form={FORM} name={name} defaultValue={valor.toFixed(2)} inputMode="decimal" pattern="\d{1,4}([.,]\d{1,2})?" required className="display w-full bg-transparent text-xl outline-none" />
    </label>
  )
}

function TarjetaCombo({ combo, tipos }: { combo: Combo; tipos: TipoPrenda[] }) {
  const normal = combo.tipos.reduce((s, id) => s + (tipos.find(t => t.id === id)?.precio ?? 0), 0)
  const oscuro = combo.activo
  return (
    <div className={`space-y-3 rounded-xl p-4 ${oscuro ? 'bg-navy-950 text-white' : 'border border-line-dark bg-[#f8fafd]'}`}>
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-bold">{combo.nombre}</p>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${oscuro ? 'bg-sky text-navy-950' : 'bg-slate-200 text-slate-600'}`}>{oscuro ? 'ACTIVO' : 'INACTIVO'}</span>
      </div>
      <p className="flex flex-wrap items-center gap-2">
        {combo.tipos.map((id, i) => (
          <span key={id} className="contents">
            {i > 0 && <span className="font-bold text-sky">+</span>}
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${oscuro ? 'border-white/20 bg-white/10' : 'border-line-dark bg-white'}`}>
              {tipos.find(t => t.id === id)?.nombre ?? '—'}
            </span>
          </span>
        ))}
      </p>
      <p className="flex items-end gap-2.5">
        <span className={`display text-[32px] ${oscuro ? 'text-sky' : ''}`}>{formatoPrecio(combo.precio)}</span>
        {normal > combo.precio && <span className="pb-1.5 text-[13px] text-muted line-through">{formatoPrecio(normal)}</span>}
      </p>
    </div>
  )
}

export default async function PreciosPage() {
  // El layout no basta: Next genera la página en paralelo. Se verifica aquí también.
  await requerirAdmin()
  const [tipos, combos, parches, shorts] = await Promise.all([listarTipos(), listarCombos(), listarParches(), listarShorts()])
  const prueba = modoPrueba()

  return (
    <>
      <PageHeader titulo="Precios y combos" subtitulo="Cambias el precio de un tipo y se actualiza en todas sus camisetas.">
        <FormAccion id={FORM} accion={guardarPreciosAccion} className="flex flex-col items-end gap-2">
          <BotonEnviar className={boton.oscuro}>Guardar cambios</BotonEnviar>
        </FormAccion>
      </PageHeader>

      <div className="grid gap-5 xl:grid-cols-[1fr_400px]">
        <div className="min-w-0 space-y-5">
          <Card className="overflow-hidden">
            <CardHeader titulo="Tipos de prenda" subtitulo="El precio base de cada camiseta sale de aquí. Precios con centavos: 43.99" />
            <details className="border-b border-line-dark">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 px-5 py-3 text-sm font-semibold"><Plus size={14} aria-hidden /> Nuevo tipo de prenda</summary>
              <FormTipo />
            </details>
            <ul>
              {tipos.map(t => (
                <li key={t.id} className="border-b border-line-dark last:border-0">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-2.5 text-sm">
                    <span className="min-w-40 flex-1 font-semibold">
                      {t.nombre}
                      {t.esShort && <span className="ml-2 rounded bg-sky-soft px-1.5 py-0.5 text-[10px] font-semibold text-navy-800">Short</span>}
                    </span>
                    <span className="w-44 font-mono text-xs text-ink-soft">{t.tallas.join(' · ')}</span>
                    <Interruptor name={`acepta_${t.id}`} checked={t.aceptaPersonalizacion} label={`${t.nombre} acepta nombre y número`} />
                    <CampoPrecio name={`precio_${t.id}`} valor={t.precio} label={`Precio de ${t.nombre}`} />
                    <QuitarTipo id={t.id} nombre={t.nombre} />
                  </div>
                  <details className="px-5 pb-2.5">
                    <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-xs font-semibold text-navy-700"><Pencil size={12} aria-hidden /> Editar nombre y tallas</summary>
                    <div className="mt-2"><FormTipo tipo={t} /></div>
                  </details>
                </li>
              ))}
            </ul>
            <p className="bg-[#fff7ed] px-5 py-2.5 text-xs text-orange-900">Para quitar un tipo no debe tener camisetas ni estar en un combo.</p>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader titulo="Combos" subtitulo="El cliente los elige como una opción más. No se aplican solos." />
            <div className="grid gap-3.5 p-5 lg:grid-cols-2">
              {combos.map(c => <TarjetaCombo key={c.id} combo={c} tipos={tipos} />)}
            </div>
            <details className="border-t border-line-dark px-5 py-4">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold"><Plus size={14} aria-hidden /> Nuevo combo</summary>
              <FormAccion accion={crearComboAccion} className="mt-4 grid gap-3 sm:grid-cols-[1fr_120px]">
                <input name="nombre" placeholder="Nombre del combo" aria-label="Nombre del combo" required className={input} />
                <input name="precio" inputMode="decimal" pattern="\d{1,4}([.,]\d{1,2})?" placeholder="55.00" aria-label="Precio del combo" required className={input} />
                <fieldset className="flex flex-wrap gap-2 sm:col-span-2">
                  <legend className="kicker mb-2 text-[10px] text-ink-soft">Prendas del combo (mínimo dos)</legend>
                  {tipos.map(t => (
                    <label key={t.id} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line-dark bg-[#f8fafd] px-3 py-1.5 text-[13px] font-semibold has-[:checked]:border-navy-800 has-[:checked]:bg-sky-soft">
                      <input type="checkbox" name="tipos" value={t.id} className="accent-navy-800" /> {t.nombre}
                    </label>
                  ))}
                </fieldset>
                <BotonEnviar className={`${boton.oscuro} sm:col-span-2`}>Crear combo</BotonEnviar>
              </FormAccion>
            </details>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader titulo="Pantalonetas que el cliente puede elegir" subtitulo="Al pedir un combo escoge una y su talla. El extra se suma al precio del combo." />
            <ul>
              {shorts.length === 0 && <li className="px-5 py-6 text-center text-sm text-ink-soft">Sin pantalonetas: el combo no se ofrece hasta que agregues una.</li>}
              {shorts.map(s => (
                <li key={s.id} className={`border-b border-line-dark px-5 py-4 ${s.activo ? '' : 'bg-[#f8fafd]'}`}>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="flex-1 text-sm font-semibold">
                      {s.nombre}
                      {!s.activo && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">Oculta</span>}
                    </p>
                    <span className="font-mono text-xs text-ink-soft">{s.tallas.join(' · ')}</span>
                    <span className="display text-xl">{s.extra > 0 ? `+${formatoPrecio(s.extra)}` : 'Incluida'}</span>
                  </div>
                  <div className="mt-3"><CambiarImagen key={s.id + s.foto} destino="short" id={s.id} actual={s.foto} habilitada={!prueba} /></div>
                  <details className="mt-2">
                    <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-xs font-semibold text-navy-700"><Pencil size={12} aria-hidden /> Editar</summary>
                    <div className="mt-3 space-y-3 rounded-xl bg-[#f3f8fe] p-4">
                      <FormShort short={s} />
                      <QuitarShort id={s.id} nombre={s.nombre} />
                    </div>
                  </details>
                </li>
              ))}
            </ul>
            <details className="px-5 py-4">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold"><Plus size={14} aria-hidden /> Agregar pantaloneta</summary>
              <div className="mt-4 rounded-xl bg-[#f3f8fe] p-4"><FormShort /></div>
            </details>
          </Card>
        </div>

        <Card className="h-fit overflow-hidden">
          <div id="personalizacion" className="scroll-mt-6" />
          <CardHeader titulo="Personalización" subtitulo="Lo que el cliente agrega a su prenda" />
          <div className="space-y-5 p-5">
            <div className="space-y-2 rounded-xl bg-sky-soft p-4">
              <div className="flex items-center justify-between">
                <p className="text-[15px] font-bold">Nombre y número</p>
                <span className="kicker rounded-full bg-navy-950 px-2.5 py-1 text-[10px] text-sky">Gratis</span>
              </div>
              <p className="text-xs leading-relaxed text-navy-800">
                Máx. {MAX_NOMBRE} caracteres contando espacios · Ñ, tildes y apóstrofe permitidos · número del 0 al 99.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[15px] font-bold">Parches</p>
                <p className="text-xs text-ink-soft">Precio por parche</p>
              </div>
              <CampoPrecio name="precioParche" valor={parches[0]?.precio ?? 1} label="Precio por parche" />
            </div>

            <ul>
              {parches.map(p => (
                <li key={p.id} className="flex items-center gap-3 border-b border-line-dark py-2.5 last:border-0">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e3ecf8]"><Shield size={16} className="text-navy-800" aria-hidden /></span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{p.nombre}</span>
                    <span className="block text-xs text-ink-soft">En {p.usos} {p.usos === 1 ? 'camiseta' : 'camisetas'}</span>
                  </span>
                </li>
              ))}
            </ul>

            <FormAccion accion={crearParcheAccion} className="space-y-2">
              <div className="flex gap-2">
                <input name="nombre" placeholder="Nuevo parche" aria-label="Nombre del parche" required className={input} />
                <BotonEnviar className={`${boton.claro} shrink-0`}><Plus size={14} aria-hidden /> Agregar</BotonEnviar>
              </div>
            </FormAccion>
            <p className="text-xs text-ink-soft">Tú decides qué parches acepta cada camiseta desde su ficha.</p>
          </div>
        </Card>
      </div>
    </>
  )
}
