'use client'

import Image from 'next/image'
import { ImagePlus, Loader2, Shield, Trash2 } from 'lucide-react'
import { useRef, useState, useTransition } from 'react'
import { quitarEscudoAccion, subirImagenAccion } from '@/app/admin/acciones'
import { aWebp } from '@/lib/imagen-cliente'

interface Props {
  destino: 'liga' | 'equipo' | 'short'
  id: string
  actual: string
  /** Con Supabase configurado se pueden subir imágenes. */
  habilitada: boolean
}

/**
 * Logo de liga (círculo de la vitrina, 400 px) o escudo de equipo (256 px).
 * Ambos pasan por el formato «logo» (lib/imagen-cliente): recortados y centrados igual.
 */
export function CambiarImagen({ destino, id, actual, habilitada }: Props) {
  const entrada = useRef<HTMLInputElement>(null)
  const [pendiente, iniciar] = useTransition()
  const [mensaje, setMensaje] = useState<{ ok?: string; error?: string } | null>(null)
  const esLiga = destino === 'liga'

  function subir(archivos: FileList | null) {
    const archivo = archivos?.[0]
    if (!archivo) return
    setMensaje(null)
    iniciar(async () => {
      try {
        const f = new FormData()
        f.set('destino', destino)
        f.set('id', id)
        // Todos los logos quedan iguales: sin el espacio vacío de alrededor, centrados y con el mismo margen.
        // La foto de una pantaloneta es una foto de producto: entera, sin recortar.
        const blob = destino === 'short'
          ? await aWebp(archivo, { tipo: 'caja', lado: 600 }, 0.85)
          : await aWebp(archivo, { tipo: 'logo', lado: esLiga ? 400 : 256 }, 0.9)
        f.set('imagen', blob, 'imagen.webp')
        setMensaje(await subirImagenAccion(null, f))
      } catch (e) {
        setMensaje({ error: e instanceof Error ? e.message : 'No se pudo subir la imagen' })
      } finally {
        if (entrada.current) entrada.current.value = ''
      }
    })
  }

  function quitar() {
    if (!confirm('¿Quitar el escudo de este equipo?')) return
    iniciar(async () => {
      const f = new FormData()
      f.set('id', id)
      await quitarEscudoAccion(f)
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className={`relative grid size-14 shrink-0 place-items-center overflow-hidden ${esLiga ? 'rounded-full bg-white ring-2 ring-sky' : 'rounded-lg bg-[#e3ecf8]'}`}>
        {actual
          ? <Image src={actual} alt="" fill sizes="56px" className={`object-contain ${esLiga ? 'p-2' : 'p-1'}`} />
          : <Shield size={24} className="text-navy-800" aria-hidden />}
      </span>
      <div className="flex flex-wrap gap-2">
        <label aria-disabled={!habilitada || pendiente}
          className="relative inline-flex cursor-pointer items-center gap-1.5 overflow-hidden rounded-lg border border-navy-950/15 bg-white px-3 py-2 text-sm font-semibold text-navy-950 hover:bg-admin-bg has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
          {pendiente ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <ImagePlus size={14} aria-hidden />}
          {pendiente ? 'Subiendo…' : destino === 'short' ? (actual ? 'Cambiar foto' : 'Subir foto') : esLiga ? 'Cambiar imagen' : actual ? 'Cambiar escudo' : 'Subir escudo'}
          <input ref={entrada} type="file" accept="image/*,.heic,.heif" disabled={!habilitada || pendiente}
            className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed" aria-label="Elegir imagen de la galería"
            onChange={e => subir(e.target.files)} />
        </label>
        {destino === 'equipo' && actual && habilitada && (
          <button type="button" onClick={quitar} disabled={pendiente} aria-label="Quitar escudo"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-ink-soft hover:text-red-700 disabled:opacity-50">
            <Trash2 size={14} aria-hidden /> Quitar
          </button>
        )}
      </div>
      <p className="basis-full text-xs text-ink-soft">
        {!habilitada
          ? 'En modo de prueba no se suben imágenes: se habilita al configurar Supabase.'
          : destino === 'short'
            ? 'Foto de la pantaloneta: el cliente la ve al elegir el combo. Se muestra entera.'
            : esLiga
            ? 'Logo de la liga: se quita el fondo liso y el espacio vacío, y se centra con el mismo tamaño que las demás.'
            : 'Escudo: se quita el fondo liso y el espacio vacío, y se centra con el mismo tamaño que los demás. Mejor PNG.'}
      </p>
      {mensaje?.error && <p role="alert" className="basis-full text-xs text-red-700">{mensaje.error}</p>}
      {mensaje?.ok && <p className="basis-full text-xs text-green-700">{mensaje.ok}</p>}
    </div>
  )
}
