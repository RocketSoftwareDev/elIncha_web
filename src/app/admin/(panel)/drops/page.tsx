import type { Metadata } from 'next'
import { Download, Info, Lock, Plus } from 'lucide-react'
import Link from 'next/link'
import { abrirDropAccion, cerrarDropAccion, guardarDropAccion } from '@/app/admin/acciones'
import { CuentaRegresiva } from '@/components/admin/CuentaRegresiva'
import { ESTADO_DROP } from '@/components/admin/estados'
import { diaMesCorto, isoAInput } from '@/components/admin/fechas'
import { BotonEnviar, FormAccion } from '@/components/admin/FormAccion'
import { Aviso, Campo, Card, Chip, Interruptor, PageHeader, boton, input } from '@/components/admin/ui'
import { listarDrops, listarPedidos, resumenDrop } from '@/lib/data/admin'
import { llegada, resumenDrop as resumenWeb } from '@/lib/domain/drop'
import { formatoPrecio } from '@/lib/domain/pricing'
import type { Drop } from '@/lib/domain/types'
import { ahora } from '@/lib/reloj'

export const metadata: Metadata = { title: 'Drops' }

function pasos(drop: Drop, ahora: number) {
  const { desde, hasta } = llegada(drop)
  const hecho = (f: Date | string) => new Date(f).getTime() <= ahora
  return [
    { fecha: diaMesCorto(drop.abreEn), titulo: 'Apertura', nota: 'Se abre la vitrina', hecho: hecho(drop.abreEn) },
    { fecha: diaMesCorto(drop.cierraEn), titulo: 'Cierre de pedidos', nota: '23:59 · último día', hecho: hecho(drop.cierraEn) },
    { fecha: diaMesCorto(drop.envioEn), titulo: 'Envío al proveedor', nota: 'Se manda el lote', hecho: hecho(drop.envioEn) },
    { fecha: `${diaMesCorto(desde).split(' ')[0]}–${diaMesCorto(hasta)}`, titulo: 'Llegada estimada', nota: `${drop.llegadaMinDias} a ${drop.llegadaMaxDias} días`, hecho: hecho(desde) },
    { fecha: diaMesCorto(hasta).split(' ')[1] ?? '', titulo: 'Entrega', nota: 'Machala y El Oro', hecho: hecho(hasta) },
  ]
}

async function DropActivo({ drop, ahora }: { drop: Drop | undefined; ahora: number }) {
  if (!drop) {
    return (
      <section className="space-y-3 rounded-2xl bg-navy-950 p-7 text-white">
        <p className="kicker flex items-center gap-2 text-[10px] text-red-300">
          <span className="h-2 w-2 rounded-full bg-red-400" /> Sin drop activo
        </p>
        <h2 className="display text-[44px]">Ningún drop disponible</h2>
        <p className="max-w-lg text-sm text-muted">
          La web muestra la cuenta regresiva en 00:00:00, el mensaje «Pronto realizaremos otro drop» y el carrito está bloqueado hasta que abras el siguiente.
        </p>
      </section>
    )
  }

  const r = await resumenDrop(drop.id)
  const etapas = pasos(drop, ahora)
  const actual = etapas.findIndex(e => !e.hecho)

  return (
    <section className="space-y-7 rounded-2xl bg-navy-950 p-7 text-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <p className="kicker flex items-center gap-2 text-[10px] text-whatsapp">
            <span className="h-2 w-2 rounded-full bg-whatsapp" /> Abierto · recibiendo pedidos
          </p>
          <h2 className="display text-[44px]">{drop.nombre}</h2>
        </div>
        <div className="text-right">
          <p className="kicker text-[10px] text-sky">Cierra en</p>
          <CuentaRegresiva cierraEn={drop.cierraEn} ahoraServidor={ahora} className="display text-4xl" />
        </div>
      </div>

      <ol className="grid grid-cols-5 gap-2" aria-label="Línea de tiempo del drop">
        {etapas.map((e, i) => (
          <li key={e.titulo} className="space-y-3">
            <div className="flex items-center">
              <span
                className={`shrink-0 rounded-full ${i === actual ? 'h-5 w-5 border-[3px] border-white bg-sky' : 'h-4 w-4'} ${e.hecho ? 'bg-sky' : i === actual ? '' : 'bg-white/20'}`}
                aria-hidden
              />
              {i < etapas.length - 1 && <span className={`h-[3px] flex-1 ${e.hecho && etapas[i + 1].hecho ? 'bg-sky' : 'bg-white/15'}`} aria-hidden />}
            </div>
            <div className="space-y-0.5 pr-2">
              <p className={`kicker text-[10px] ${e.hecho ? 'text-sky' : 'text-[#7f8fb8]'}`}>{e.fecha}</p>
              <p className="text-[13px] font-bold">{e.titulo}</p>
              <p className="text-xs text-muted">{e.nota}</p>
            </div>
          </li>
        ))}
      </ol>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Pedidos', String(r.pedidos)],
          ['Prendas', String(r.prendas)],
          ['Total vendido', formatoPrecio(r.vendido)],
          ['Reservas pagadas', `${r.reservasPagadas} / ${r.pedidos}`],
        ].map(([k, v]) => (
          <div key={k} className="space-y-1 rounded-xl border border-white/10 bg-white/5 p-4">
            <dt className="kicker text-[10px] text-muted">{k}</dt>
            <dd className="display text-3xl">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

async function Historial({ drops }: { drops: Drop[] }) {
  const pedidos = await listarPedidos()
  return (
    <Card className="overflow-hidden">
      <h2 className="border-b border-line-dark px-5 py-4 text-base font-bold">Historial de drops</h2>
      <table className="w-full text-sm">
        <tbody>
          {drops.map(d => {
            const { desde, hasta } = llegada(d)
            const llegaTxt = d.estado === 'entregado' ? `Entregado ${diaMesCorto(hasta).toLowerCase()}` : `Llega ${diaMesCorto(desde).split(' ')[0]}–${diaMesCorto(hasta).toLowerCase()}`
            const n = pedidos.filter(p => p.dropId === d.id).length
            return (
              <tr key={d.id} className="border-b border-line-dark last:border-0">
                <td className="px-5 py-3.5 font-semibold">{d.nombre}</td>
                <td className="px-3 py-3.5 text-ink-soft">{diaMesCorto(d.abreEn).toLowerCase()} → {diaMesCorto(d.cierraEn).toLowerCase()}</td>
                <td className="px-3 py-3.5 text-ink-soft">{llegaTxt}</td>
                <td className="px-3 py-3.5">{n} pedidos</td>
                <td className="px-5 py-3.5"><Chip clase={ESTADO_DROP[d.estado].clase}>{ESTADO_DROP[d.estado].label}</Chip></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Card>
  )
}

function CamposFechas({ drop }: { drop?: Drop }) {
  return (
    <>
      <Campo label="Nombre del drop">
        <input name="nombre" defaultValue={drop?.nombre} required className={input} />
      </Campo>
      <div className="grid grid-cols-2 gap-2.5">
        <Campo label="Abre"><input type="datetime-local" name="abreEn" defaultValue={drop && isoAInput(drop.abreEn)} required className={input} /></Campo>
        <Campo label="Cierra"><input type="datetime-local" name="cierraEn" defaultValue={drop && isoAInput(drop.cierraEn)} required className={input} /></Campo>
      </div>
      <Campo label="Envío al proveedor">
        <input type="datetime-local" name="envioEn" defaultValue={drop && isoAInput(drop.envioEn)} required className={input} />
      </Campo>
      <div className="grid grid-cols-2 gap-2.5">
        <Campo label="Llega desde (días)"><input type="number" name="llegadaMinDias" min={1} max={120} defaultValue={drop?.llegadaMinDias ?? 20} required className={input} /></Campo>
        <Campo label="Hasta (días)"><input type="number" name="llegadaMaxDias" min={1} max={120} defaultValue={drop?.llegadaMaxDias ?? 30} required className={input} /></Campo>
      </div>
    </>
  )
}

function EditarDrop({ drop }: { drop: Drop }) {
  const web = resumenWeb(drop)
  return (
    <Card className="space-y-4 p-6">
      <h2 className="text-lg font-bold">Editar {drop.nombre}</h2>
      <FormAccion accion={guardarDropAccion} className="space-y-4">
        <input type="hidden" name="id" value={drop.id} />
        <CamposFechas drop={drop} />
        <p className="flex gap-2.5 rounded-lg bg-sky-soft p-3 text-xs leading-relaxed text-navy-800">
          <Info size={16} className="shrink-0" aria-hidden />
          En la web se verá: «Pide hasta el {web.pideHasta} · llega entre el {web.llegaEntre}»
        </p>
        <Interruptor name="mostrarCuentaRegresiva" defaultChecked={drop.mostrarCuentaRegresiva} label="Mostrar cuenta regresiva en la web" />
        {drop.estado === 'abierto' && (
          <p className="flex gap-2.5 rounded-lg bg-amber-100 p-3 text-xs leading-relaxed text-amber-900">
            <Lock size={16} className="shrink-0" aria-hidden />
            Al cerrar: cuenta regresiva en 00:00:00, mensaje «Pronto realizaremos otro drop» y carrito bloqueado hasta que abras el siguiente.
          </p>
        )}
        <BotonEnviar className={`${boton.oscuro} w-full`}>Guardar cambios</BotonEnviar>
      </FormAccion>
      {drop.estado === 'abierto' && (
        <form action={cerrarDropAccion}>
          <input type="hidden" name="id" value={drop.id} />
          <button type="submit" className={`${boton.peligro} w-full`}>Cerrar drop ahora</button>
        </form>
      )}
    </Card>
  )
}

function AbrirDrop({ hayAbierto }: { hayAbierto: boolean }) {
  return (
    <Card className="p-6">
      <details>
        <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-bold">
          Abrir nuevo drop <Plus size={18} aria-hidden />
        </summary>
        <div className="mt-4 space-y-4">
          {hayAbierto ? (
            <Aviso tipo="alerta">Ya hay un drop abierto. Ciérralo antes de abrir otro: solo puede haber uno a la vez.</Aviso>
          ) : (
            <FormAccion accion={abrirDropAccion} className="space-y-4">
              <CamposFechas />
              <BotonEnviar className={`${boton.oscuro} w-full`}>Abrir drop</BotonEnviar>
            </FormAccion>
          )}
        </div>
      </details>
    </Card>
  )
}

export default async function DropsPage() {
  const drops = await listarDrops()
  const abierto = drops.find(d => d.estado === 'abierto')
  const editable = abierto ?? drops[0]
  const horaActual = ahora()

  return (
    <>
      <PageHeader titulo="Drops" subtitulo="Solo hay un drop abierto a la vez. Cuando lo cierras, la web muestra «Ningún drop disponible» y el carrito se bloquea.">
        {editable && (
          <Link href={`/admin/pedidos/export?drop=${editable.id}`} className={boton.claro} prefetch={false}>
            <Download size={16} aria-hidden /> Exportar pedidos
          </Link>
        )}
        <a href="#abrir" className={boton.oscuro}><Plus size={16} className="text-sky" aria-hidden /> Abrir nuevo drop</a>
      </PageHeader>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-5">
          <DropActivo drop={abierto} ahora={horaActual} />
          <Historial drops={drops} />
        </div>
        <div className="space-y-5" id="abrir">
          {editable && <EditarDrop drop={editable} />}
          <AbrirDrop hayAbierto={!!abierto} />
        </div>
      </div>
    </>
  )
}
