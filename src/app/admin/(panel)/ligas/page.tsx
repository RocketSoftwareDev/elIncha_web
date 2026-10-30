import { requerirAdmin } from '@/lib/auth/sesion'
import type { Metadata } from 'next'
import { ChevronRight, Eye, EyeOff, GripVertical, Plus, Shield } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { alternarLigaVisibleAccion, crearEquipoAccion, crearLigaAccion } from '@/app/admin/acciones'
import { EliminarLiga } from '@/components/admin/EliminarLiga'
import { BotonEnviar, FormAccion } from '@/components/admin/FormAccion'
import { Card, PageHeader, boton, input } from '@/components/admin/ui'
import { CambiarImagen } from '@/components/admin/CambiarImagen'
import { listarEquipos, listarLigas, listarProductos, modoPrueba } from '@/lib/data/admin'
import { formatoPrecio } from '@/lib/domain/pricing'

export const metadata: Metadata = { title: 'Ligas y equipos' }

type Params = Promise<{ liga?: string; equipo?: string }>

export default async function LigasPage({ searchParams }: { searchParams: Params }) {
  // El layout no basta: Next genera la página en paralelo. Se verifica aquí también.
  await requerirAdmin()
  const sp = await searchParams
  const [ligas, equipos, productos] = await Promise.all([listarLigas(), listarEquipos(), listarProductos()])
  const prueba = modoPrueba()
  const liga = ligas.find(l => l.id === sp.liga) ?? ligas[0]
  const deLiga = equipos.filter(e => e.ligaId === liga?.id)
  const equipo = deLiga.find(e => e.id === sp.equipo) ?? deLiga[0]
  const opciones = productos.filter(p => p.equipoId === equipo?.id)
  const opcionesDeLiga = productos.filter(p => p.liga.id === liga?.id).length

  return (
    <>
      <PageHeader titulo="Ligas y equipos" subtitulo="Así se arma la vitrina: liga → equipo → opciones disponibles." />

      <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line-dark px-4 py-3.5">
            <h2 className="text-[15px] font-bold">Ligas en la vitrina</h2>
            <span className="kicker text-[10px] text-ink-soft">{ligas.filter(l => l.visible).length} / {ligas.length}</span>
          </div>
          <ul className="space-y-0.5 p-2">
            {ligas.map(l => {
              const activa = l.id === liga?.id
              return (
                <li key={l.id}>
                  <Link href={`/admin/ligas?liga=${l.id}`} aria-current={activa ? 'page' : undefined}
                    className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 ${activa ? 'bg-navy-950 text-white' : 'hover:bg-admin-bg'} ${l.visible ? '' : 'opacity-60'}`}>
                    <GripVertical size={14} className={activa ? 'text-[#5b6b95]' : 'text-[#b6c0d6]'} aria-hidden />
                    <span className={`relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#e3ecf8] ${activa ? 'ring-2 ring-sky' : ''}`}>
                      {l.foto ? <Image src={l.foto} alt="" fill sizes="36px" className="object-cover" /> : <Shield size={16} className="text-navy-800" aria-hidden />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-sm font-semibold">
                        {l.nombre}
                        {!l.visible && <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800"><EyeOff size={10} aria-hidden /> Oculta</span>}
                      </span>
                      <span className={`block text-xs ${activa ? 'text-muted' : 'text-ink-soft'}`}>{equipos.filter(e => e.ligaId === l.id).length} equipos</span>
                    </span>
                    <ChevronRight size={16} className={activa ? 'text-sky' : 'text-[#b6c0d6]'} aria-hidden />
                  </Link>
                </li>
              )
            })}
          </ul>
          <FormAccion accion={crearLigaAccion} className="space-y-2 border-t border-line-dark p-3">
            <label className="sr-only" htmlFor="nueva-liga">Nombre de la nueva liga</label>
            <input id="nueva-liga" name="nombre" placeholder="Nueva liga (ej. Serie A)" required maxLength={40} className={input} />
            <BotonEnviar className={`${boton.claro} w-full py-2`}><Plus size={14} aria-hidden /> Agregar liga</BotonEnviar>
          </FormAccion>
        </Card>

        {liga && (
          <div className="min-w-0 space-y-5">
            <Card className="space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="display text-[30px]">{liga.nombre}</h2>
                  <p className="text-[13px] text-ink-soft">Círculo #{liga.orden + 1} en la vitrina · {deLiga.length} equipos · {opcionesDeLiga} opciones</p>
                </div>
                <div className="w-full sm:w-auto sm:max-w-sm">
                  <CambiarImagen key={liga.id + liga.foto} destino="liga" id={liga.id} actual={liga.foto} habilitada={!prueba} />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-dark pt-4">
                <form action={alternarLigaVisibleAccion} className="flex items-center gap-3">
                  <input type="hidden" name="id" value={liga.id} />
                  <span className="text-sm">
                    {liga.visible
                      ? <><Eye size={14} className="mr-1 inline text-green-700" aria-hidden />Visible en la tienda</>
                      : <><EyeOff size={14} className="mr-1 inline text-amber-700" aria-hidden />Oculta: no aparece en la tienda</>}
                  </span>
                  <button type="submit" className={`${boton.claro} py-2`}>{liga.visible ? 'Ocultar' : 'Mostrar en la tienda'}</button>
                </form>
              </div>
              <EliminarLiga key={liga.id} id={liga.id} nombre={liga.nombre} equipos={deLiga.length} camisetas={opcionesDeLiga} />
            </Card>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {deLiga.map(e => {
                const activo = e.id === equipo?.id
                return (
                  <Link key={e.id} href={`/admin/ligas?liga=${liga.id}&equipo=${e.id}`} aria-current={activo ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-xl bg-white p-3.5 ${activo ? 'border-2 border-navy-950' : 'border border-line-dark'}`}>
                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-admin-bg">
                      {e.escudo
                        ? <Image src={e.escudo} alt="" fill sizes="40px" className="object-contain p-1" />
                        : <Shield size={20} className="text-navy-800" aria-hidden />}
                    </span>
                    <span>
                      <span className="block text-sm font-bold">{e.nombre}</span>
                      <span className="block text-xs text-ink-soft">{productos.filter(p => p.equipoId === e.id).length} opciones</span>
                    </span>
                  </Link>
                )
              })}
              <FormAccion accion={crearEquipoAccion} className="flex flex-col gap-2 rounded-xl border border-dashed border-navy-950/20 p-3">
                <input type="hidden" name="ligaId" value={liga.id} />
                <label className="sr-only" htmlFor="nuevo-equipo">Nombre del equipo</label>
                <input id="nuevo-equipo" name="nombre" placeholder="Nuevo equipo" required className={input} />
                <BotonEnviar className={`${boton.claro} py-2`}><Plus size={14} aria-hidden /> Agregar equipo</BotonEnviar>
              </FormAccion>
            </div>

            {equipo && (
              <Card className="overflow-hidden">
                <div className="border-b border-line-dark bg-[#f8fafd] px-5 py-4">
                  <p className="kicker mb-2 text-[10px] text-ink-soft">Escudo de {equipo.nombre}</p>
                  <CambiarImagen key={equipo.id + equipo.escudo} destino="equipo" id={equipo.id} actual={equipo.escudo} habilitada={!prueba} />
                </div>
                <div className="flex items-center justify-between border-b border-line-dark px-5 py-3.5">
                  <div>
                    <h2 className="text-[15px] font-bold">Opciones de {equipo.nombre}</h2>
                    <p className="text-xs text-ink-soft">Lo que el cliente ve al tocar el equipo en la web</p>
                  </div>
                  <Link href="/admin/productos/nueva" className={`${boton.claro} py-2`}><Plus size={14} aria-hidden /> Nueva opción</Link>
                </div>
                <ul className="px-5">
                  {opciones.length === 0 && <li className="py-6 text-center text-sm text-ink-soft">Este equipo todavía no tiene opciones.</li>}
                  {opciones.map(p => (
                    <li key={p.id} className="flex items-center gap-3.5 border-b border-line-dark py-2.5 last:border-0">
                      <span className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md bg-[#e3ecf8]">
                        {p.fotos[0] && <Image src={p.fotos[0]} alt="" fill sizes="40px" className="object-cover" />}
                      </span>
                      <Link href={`/admin/productos/${p.id}`} className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{p.nombre}</span>
                        <span className="block text-xs text-ink-soft">Parches: {p.parches.length ? p.parches.map(x => x.nombre).join(' · ') : '—'}</span>
                      </Link>
                      <span className="hidden w-48 sm:block"><span className="rounded-md bg-sky-soft px-2 py-1 text-xs font-semibold text-navy-800">{p.tipo.nombre}</span></span>
                      <span className="display w-14 text-right text-xl">{formatoPrecio(p.precioEspecial ?? p.tipo.precio)}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        )}
      </div>
    </>
  )
}
