'use client'

import Image from 'next/image'
import { ChevronLeft, ChevronRight, Crop, ImagePlus, Loader2, Maximize2, X } from 'lucide-react'
import { useRef, useState, useTransition } from 'react'
import { moverFotoAccion, quitarFotoAccion, subirFotoAccion } from '@/app/admin/acciones'
import { Precio } from '@/components/Precio'
import { aWebp } from '@/lib/imagen-cliente'

const MAX_FOTOS = 6

interface Props {
  productoId: string | null
  fotos: string[]
  habilitada: boolean
  /** Para la vista previa: cómo se verá en la tienda. */
  muestra: { titulo: string; liga: string; precio: number }
}

export function SubidaFotos({ productoId, fotos, habilitada, muestra }: Props) {
  const entrada = useRef<HTMLInputElement>(null)
  const [pendiente, iniciar] = useTransition()
  const [mensaje, setMensaje] = useState<{ ok?: string; error?: string } | null>(null)
  const [elegida, setElegida] = useState(0)
  const quedan = MAX_FOTOS - fotos.length
  const puedeSubir = habilitada && !!productoId && quedan > 0
  const actual = fotos[Math.min(elegida, fotos.length - 1)]

  function subir(archivos: FileList | null) {
    if (!archivos?.length || !productoId) return
    const lista = [...archivos].slice(0, quedan)
    setMensaje(null)
    iniciar(async () => {
      try {
        for (const archivo of lista) {
          const f = new FormData()
          f.set('productoId', productoId)
          // 1200 px de ancho en WebP: sube ~10 veces menos datos que la foto original.
          f.set('foto', await aWebp(archivo, { tipo: 'ancho', ancho: 1200 }, 0.82), 'foto.webp')
          const r = await subirFotoAccion(null, f)
          if (r?.error) return setMensaje(r)
        }
        setMensaje({ ok: archivos.length > lista.length ? `Se subieron ${lista.length}: el máximo es ${MAX_FOTOS} fotos.` : lista.length === 1 ? 'Foto agregada' : `${lista.length} fotos agregadas` })
      } catch (e) {
        setMensaje({ error: e instanceof Error ? e.message : 'No se pudo subir la foto' })
      } finally {
        if (entrada.current) entrada.current.value = ''
      }
    })
  }

  function quitar(url: string) {
    if (!productoId || !confirm('¿Quitar esta foto?')) return
    iniciar(async () => {
      const f = new FormData()
      f.set('productoId', productoId)
      f.set('url', url)
      await quitarFotoAccion(f)
      setElegida(0)
    })
  }

  function mover(url: string, destino: number) {
    if (!productoId) return
    iniciar(async () => {
      const f = new FormData()
      f.set('productoId', productoId)
      f.set('url', url)
      f.set('destino', String(destino))
      await moverFotoAccion(f)
      setElegida(destino)
    })
  }

  const editable = habilitada && !!productoId

  return (
    <>
      <div className="grid grid-cols-3 gap-2.5">
        {fotos.map((url, i) => (
          <div key={url} className={`group relative h-[132px] overflow-hidden rounded-lg bg-[#e3ecf8] ${i === elegida ? 'ring-2 ring-navy-950' : 'ring-1 ring-line-dark'}`}>
            <button type="button" onClick={() => setElegida(i)} aria-label={`Ver cómo se ve la foto ${i + 1}`} className="absolute inset-0">
              <Image src={url} alt="" fill sizes="130px" className="object-cover" />
            </button>
            {i === 0 && <span className="kicker pointer-events-none absolute left-1.5 top-1.5 rounded bg-navy-950 px-1.5 py-0.5 text-[9px] text-sky">Portada</span>}
            {editable && (
              <>
                <button type="button" onClick={() => quitar(url)} aria-label={`Quitar foto ${i + 1}`}
                  className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-white/90 text-navy-950 shadow">
                  <X size={13} />
                </button>
                <span className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between">
                  <button type="button" disabled={i === 0 || pendiente} onClick={() => mover(url, i - 1)} aria-label={`Mover foto ${i + 1} antes`}
                    className="grid size-6 place-items-center rounded-full bg-white/90 text-navy-950 shadow disabled:opacity-0"><ChevronLeft size={14} /></button>
                  <span className="rounded bg-white/90 px-1.5 text-[11px] font-bold text-navy-950">{i + 1}</span>
                  <button type="button" disabled={i === fotos.length - 1 || pendiente} onClick={() => mover(url, i + 1)} aria-label={`Mover foto ${i + 1} después`}
                    className="grid size-6 place-items-center rounded-full bg-white/90 text-navy-950 shadow disabled:opacity-0"><ChevronRight size={14} /></button>
                </span>
              </>
            )}
          </div>
        ))}
        {Array.from({ length: quedan }, (_, k) => (
          <div key={`vacio-${k}`} aria-hidden
            className="flex h-[132px] flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-navy-950/10 text-ink-soft/60">
            <ImagePlus size={20} aria-hidden />
            <span className="text-xs">Espacio {fotos.length + k + 1}</span>
          </div>
        ))}
      </div>
      {!productoId ? (
        <div className="rounded-xl border border-sky/40 bg-sky-soft p-3">
          <p className="text-sm font-semibold text-navy-950">Primero guarda los datos de la camiseta</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft">Al continuar volverás directamente a esta camiseta con el selector de fotos habilitado.</p>
          <button type="submit" name="modo" value="borrador"
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-navy-950 px-4 py-3 text-sm font-semibold text-white">
            <ImagePlus size={16} className="text-sky" aria-hidden /> Guardar y continuar con las fotos
          </button>
        </div>
      ) : (
        <div className={`rounded-xl border border-line-dark bg-sky-soft p-3 ${!puedeSubir || pendiente ? 'opacity-60' : ''}`}>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-navy-950">
            {pendiente ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <ImagePlus size={16} aria-hidden />}
            {pendiente ? 'Subiendo fotos…' : 'Seleccionar fotos del celular'}
          </p>
          {/* Visible a propósito: el control nativo es el más fiable en Safari, Chrome y navegadores internos. */}
          <input ref={entrada} type="file" multiple accept="image/*,.heic,.heif" disabled={!puedeSubir || pendiente}
            className="block w-full cursor-pointer rounded-lg border border-navy-950/15 bg-white text-sm text-ink-soft file:mr-3 file:cursor-pointer file:border-0 file:bg-navy-950 file:px-3 file:py-2.5 file:font-semibold file:text-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:file:cursor-not-allowed"
            aria-label="Seleccionar fotos del celular" onChange={e => subir(e.target.files)} />
        </div>
      )}
      {mensaje?.error && <p role="alert" className="text-xs text-red-700">{mensaje.error}</p>}
      {mensaje?.ok && <p className="text-xs text-green-700">{mensaje.ok}</p>}
      <p className="text-xs text-ink-soft">
        {!habilitada
          ? 'En modo de prueba no se suben fotos: se habilita al configurar Supabase.'
          : !productoId
            ? 'Completa los campos obligatorios y toca «Guardar y continuar con las fotos».'
            : `Máximo ${MAX_FOTOS} fotos (puedes elegir varias a la vez). Ordénalas con las flechas: la 1 es la portada. Toca una para ver cómo la verá el cliente.`}
      </p>

      {actual && <VistaPrevia foto={actual} portada={fotos[0]} indice={Math.min(elegida, fotos.length - 1)} total={fotos.length} {...muestra} />}
    </>
  )
}

/** Las 3 formas en que el cliente ve la foto: tarjeta de la vitrina, ficha y visor. */
function VistaPrevia({ foto, portada, indice, total, titulo, liga, precio }: { foto: string; portada: string; indice: number; total: number; titulo: string; liga: string; precio: number }) {
  return (
    <div className="space-y-3 border-t border-line-dark pt-4">
      <div>
        <p className="text-sm font-bold">Así la verá el cliente</p>
        <p className="text-xs text-ink-soft">Foto {indice + 1}. La tarjeta de la vitrina siempre usa la portada.</p>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        <figure className="space-y-1.5">
          <div className="space-y-1.5 bg-navy-950 p-1.5">
            {/* Igual que TarjetaProducto: la portada se recorta para llenar la tarjeta. */}
            <div className="relative aspect-[300/340] overflow-hidden bg-navy-800">
              <Image src={portada} alt="" fill sizes="120px" className="object-cover" />
              <span className="kicker absolute left-1 top-1 bg-sky px-1 text-[7px] font-bold text-navy-950">{liga}</span>
            </div>
            <div className="flex items-start justify-between gap-1">
              <span className="line-clamp-2 text-[9px] font-semibold leading-tight text-white">{titulo}</span>
              <Precio valor={precio} className="display text-[13px] text-sky" />
            </div>
          </div>
          <figcaption className="text-[10px] leading-tight text-ink-soft">1 · Tarjeta (recorta)</figcaption>
        </figure>
        <figure className="space-y-1.5">
          {/* Igual que la galería de la ficha: completa y centrada, sin zoom. */}
          <div className="relative aspect-[4/5] border border-line-dark bg-navy-900">
            <Image src={foto} alt="" fill sizes="120px" className="object-contain" />
            <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-navy-950/80 text-white"><Maximize2 size={9} aria-hidden /></span>
          </div>
          <figcaption className="text-[10px] leading-tight text-ink-soft">2 · Ficha (completa)</figcaption>
        </figure>
        <figure className="space-y-1.5">
          <div className="relative aspect-[4/5] bg-black">
            <Image src={foto} alt="" fill sizes="120px" className="object-contain p-2" />
            <span className="kicker absolute left-1 top-1 text-[8px] text-white">{indice + 1} / {total}</span>
            <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-white/20 text-white"><X size={9} aria-hidden /></span>
          </div>
          <figcaption className="text-[10px] leading-tight text-ink-soft">3 · Visor (al tocar)</figcaption>
        </figure>
      </div>
      <p className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] text-amber-900">
        <Crop size={13} className="mt-px shrink-0" aria-hidden /> En la tarjeta la portada se recorta: deja la camiseta al centro de la foto. En la ficha y el visor se ve completa.
      </p>
    </div>
  )
}
