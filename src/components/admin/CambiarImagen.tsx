'use client'

import Image from 'next/image'
import { ImagePlus, Loader2, Shield, Trash2 } from 'lucide-react'
import { useRef, useState, useTransition } from 'react'
import { quitarEscudoAccion, subirImagenAccion } from '@/app/admin/acciones'
import { aWebp } from '@/lib/imagen-cliente'

interface Props {
  destino: 'liga' | 'equipo'
  id: string
  actual: string
  /** Con Supabase configurado se pueden subir imágenes. */
  habilitada: boolean
}

/**
 * Liga: imagen del círculo de la vitrina (recorte cuadrado de 600 px).
 * Equipo: escudo completo dentro de 256 px, con fondo transparente.
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
        const blob = esLiga ? await aWebp(archivo, { tipo: 'cuadrado', lado: 600 }) : await aWebp(archivo, { tipo: 'caja', lado: 256 }, 0.9)
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
      <span className={`relative grid size-14 shrink-0 place-items-center overflow-hidden bg-[#e3ecf8] ${esLiga ? 'rounded-full ring-2 ring-sky' : 'rounded-lg'}`}>
        {actual
          ? <Image src={actual} alt="" fill sizes="56px" className={esLiga ? 'object-cover' : 'object-contain p-1.5'} />
          : <Shield size={24} className="text-navy-800" aria-hidden />}
      </span>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={!habilitada || pendiente} onClick={() => entrada.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-navy-950/15 bg-white px-3 py-2 text-sm font-semibold text-navy-950 hover:bg-admin-bg disabled:opacity-50">
          {pendiente ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <ImagePlus size={14} aria-hidden />}
          {pendiente ? 'Subiendo…' : esLiga ? 'Cambiar imagen' : actual ? 'Cambiar escudo' : 'Subir escudo'}
        </button>
        {!esLiga && actual && habilitada && (
          <button type="button" onClick={quitar} disabled={pendiente} aria-label="Quitar escudo"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-ink-soft hover:text-red-700 disabled:opacity-50">
            <Trash2 size={14} aria-hidden /> Quitar
          </button>
        )}
      </div>
      <input ref={entrada} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e => subir(e.target.files)} />
      <p className="basis-full text-xs text-ink-soft">
        {!habilitada
          ? 'En modo de prueba no se suben imágenes: se habilita al configurar Supabase.'
          : esLiga
            ? 'Se ve como círculo en el inicio y en la vitrina. Usa una imagen cuadrada; se recorta al centro.'
            : 'Mejor un PNG con fondo transparente. Se ajusta solo, sin recortar.'}
      </p>
      {mensaje?.error && <p role="alert" className="basis-full text-xs text-red-700">{mensaje.error}</p>}
      {mensaje?.ok && <p className="basis-full text-xs text-green-700">{mensaje.ok}</p>}
    </div>
  )
}
