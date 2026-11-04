import { requerirAdmin } from '@/lib/auth/sesion'
import type { Metadata } from 'next'
import { ArrowDown, ArrowUp, ExternalLink, EyeOff, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { eliminarSeccionAccion, moverSeccionAccion } from '@/app/admin/acciones'
import { BotonConfirmar } from '@/components/admin/BotonConfirmar'
import { FormSeccion } from '@/components/admin/FormSeccion'
import { Aviso, Card, Chip, PageHeader, boton } from '@/components/admin/ui'
import { listarSoporte } from '@/lib/data/admin'
import { MAX_SECCIONES, seccionesPublicas } from '@/lib/domain/soporte'

export const metadata: Metadata = { title: 'Soporte' }

function BotonIcono({ accion, id, delta, etiqueta, deshabilitado, children, peligro }: {
  accion: (f: FormData) => Promise<void>; id: string; delta?: string; etiqueta: string; deshabilitado?: boolean; children: React.ReactNode; peligro?: boolean
}) {
  return (
    <form action={accion}>
      <input type="hidden" name="id" value={id} />
      {delta && <input type="hidden" name="delta" value={delta} />}
      {peligro ? (
        <BotonConfirmar pregunta={`¿${etiqueta}? Se borra su texto.`} etiqueta={etiqueta}
          className="grid size-8 place-items-center rounded-lg border border-line-dark text-red-700 hover:bg-red-50">
          {children}
        </BotonConfirmar>
      ) : (
        <button type="submit" disabled={deshabilitado} aria-label={etiqueta}
          className="grid size-8 place-items-center rounded-lg border border-line-dark hover:bg-admin-bg disabled:opacity-30">
          {children}
        </button>
      )}
    </form>
  )
}

export default async function SoportePage() {
  // El layout no basta: Next genera la página en paralelo. Se verifica aquí también.
  await requerirAdmin()
  const secciones = await listarSoporte()
  const publicas = seccionesPublicas(secciones)

  return (
    <>
      <PageHeader titulo="Soporte" subtitulo="Cómo comprar, tallas, envíos, cambios, lavado… Tú escribes cada sección y decides cuáles se ven.">
        {publicas.length > 0 && (
          <Link href="/soporte" target="_blank" className={boton.claro}><ExternalLink size={15} aria-hidden /> Ver la página</Link>
        )}
      </PageHeader>

      <Aviso tipo={publicas.length ? 'ok' : 'alerta'}>
        {publicas.length
          ? `La página /soporte está publicada con ${publicas.length} ${publicas.length === 1 ? 'sección' : 'secciones'}. Los enlaces de ayuda del pie de página llevan ahí.`
          : 'La página /soporte está bloqueada: no se ve en la tienda hasta que muestres al menos una sección con texto.'}
      </Aviso>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-4">
          {secciones.map((s, i) => (
            <Card key={s.id} className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-dark px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs text-ink-soft">{i + 1}</span>
                  <h2 className="text-[15px] font-bold">{s.titulo}</h2>
                  {s.visible && s.contenido.trim()
                    ? <Chip clase="bg-green-50 text-green-800">Visible</Chip>
                    : <Chip clase="bg-amber-100 text-amber-800"><EyeOff size={11} className="mr-1" aria-hidden />{s.contenido.trim() ? 'Oculta' : 'Sin texto'}</Chip>}
                </div>
                <div className="flex gap-1.5">
                  <BotonIcono accion={moverSeccionAccion} id={s.id} delta="-1" etiqueta={`Subir ${s.titulo}`} deshabilitado={i === 0}><ArrowUp size={14} /></BotonIcono>
                  <BotonIcono accion={moverSeccionAccion} id={s.id} delta="1" etiqueta={`Bajar ${s.titulo}`} deshabilitado={i === secciones.length - 1}><ArrowDown size={14} /></BotonIcono>
                  <BotonIcono accion={eliminarSeccionAccion} id={s.id} etiqueta={`Quitar ${s.titulo}`} peligro><Trash2 size={14} /></BotonIcono>
                </div>
              </div>
              <div className="p-5"><FormSeccion key={s.id + s.contenido.length + s.titulo} seccion={s} /></div>
            </Card>
          ))}

          {secciones.length < MAX_SECCIONES ? (
            <Card className="p-5">
              <h2 className="mb-3 flex items-center gap-1.5 text-[15px] font-bold"><Plus size={15} aria-hidden /> Nueva sección</h2>
              <FormSeccion />
            </Card>
          ) : (
            <Aviso>Llegaste al máximo de {MAX_SECCIONES} secciones.</Aviso>
          )}
        </div>

        <Card className="h-fit space-y-3 p-5 text-sm">
          <h2 className="font-bold">Cómo escribir</h2>
          <dl className="space-y-3 text-xs text-ink-soft">
            <div><dt className="font-semibold text-navy-950">Párrafos</dt><dd>Deja una línea en blanco entre uno y otro.</dd></div>
            <div><dt className="font-semibold text-navy-950">Viñetas</dt><dd>Empieza la línea con un guion y espacio: <code className="rounded bg-admin-bg px-1">- Agua fría</code></dd></div>
            <div>
              <dt className="font-semibold text-navy-950">Tablas (ej. tallas)</dt>
              <dd>Separa las columnas con <code className="rounded bg-admin-bg px-1">|</code>. La primera línea son los títulos.</dd>
              <pre className="mt-1.5 rounded-lg bg-admin-bg p-2.5 font-mono text-[11px] text-navy-950">{'Talla | Pecho | Largo\nS | 50 | 70\nM | 53 | 72'}</pre>
            </div>
          </dl>
          <p className="text-xs text-ink-soft">Usa «Vista previa» para ver cómo queda antes de guardar. Solo se publica lo que marques como visible y tenga texto.</p>
        </Card>
      </div>
    </>
  )
}
