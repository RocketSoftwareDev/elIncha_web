'use client'

import Image from 'next/image'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { useRef, useState, useTransition } from 'react'
import { quitarFotoAccion, subirFotoAccion } from '@/app/admin/acciones'
import { aWebp } from '@/lib/imagen-cliente'

const MAX_FOTOS = 6

interface Props {
  productoId: string | null
  fotos: string[]
  habilitada: boolean
}

export function SubidaFotos({ productoId, fotos, habilitada }: Props) {
  const entrada = useRef<HTMLInputElement>(null)
  const [pendiente, iniciar] = useTransition()
  const [mensaje, setMensaje] = useState<{ ok?: string; error?: string } | null>(null)
  const puedeSubir = habilitada && !!productoId && fotos.length < MAX_FOTOS

  function subir(archivos: FileList | null) {
    const archivo = archivos?.[0]
    if (!archivo || !productoId) return
    setMensaje(null)
    iniciar(async () => {
      try {
        const f = new FormData()
        f.set('productoId', productoId)
        // 1200 px de ancho en WebP: sube ~10 veces menos datos que la foto original.
        f.set('foto', await aWebp(archivo, { tipo: 'ancho', ancho: 1200 }, 0.82), 'foto.webp')
        setMensaje(await subirFotoAccion(null, f))
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
    })
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-2.5">
        {fotos.map((url, i) => (
          <div key={url} className={`group relative h-[110px] overflow-hidden rounded-lg bg-[#e3ecf8] ${i === 0 ? 'ring-2 ring-navy-950' : ''}`}>
            <Image src={url} alt={`Foto ${i + 1}`} fill sizes="90px" className="object-cover" />
            {habilitada && productoId && (
              <button type="button" onClick={() => quitar(url)} aria-label={`Quitar foto ${i + 1}`}
                className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-navy-950/80 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100">
                <X size={13} />
              </button>
            )}
          </div>
        ))}
        {fotos.length < MAX_FOTOS && (
          <button type="button" disabled={!puedeSubir || pendiente} onClick={() => entrada.current?.click()}
            className="flex h-[110px] flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-navy-950/20 text-ink-soft hover:border-navy-950/50 disabled:opacity-50">
            {pendiente ? <Loader2 size={20} className="animate-spin" aria-hidden /> : <ImagePlus size={20} aria-hidden />}
            <span className="text-xs">{pendiente ? 'Subiendo…' : 'Subir'}</span>
          </button>
        )}
      </div>
      <input ref={entrada} type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="hidden" onChange={e => subir(e.target.files)} />
      {mensaje?.error && <p role="alert" className="text-xs text-red-700">{mensaje.error}</p>}
      {mensaje?.ok && <p className="text-xs text-green-700">{mensaje.ok}</p>}
      <p className="text-xs text-ink-soft">
        {!habilitada
          ? 'En modo de prueba no se suben fotos: se habilita al configurar Supabase.'
          : !productoId
            ? 'Guarda la camiseta primero; después podrás subir sus fotos.'
            : 'La primera es la portada. Se reducen solas a 1200 px. Usa fotos reales: generan confianza.'}
      </p>
    </>
  )
}
