import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { BadgeCheck, Eye, Info, Lightbulb, Link2, MessageCircle, Search, SearchX, ShieldCheck, ShoppingBag, TriangleAlert, Users } from 'lucide-react'
import { FacebookLogo, InstagramLogo } from '@phosphor-icons/react/dist/ssr'
import { Card, CardHeader, PageHeader } from '@/components/admin/ui'
import { convierteMal, porcentaje, RANGOS, type Estadisticas, type Fuente, type Rango } from '@/lib/domain/analitica'
import { estadisticas } from '@/lib/data/estadisticas'

export const metadata: Metadata = { title: 'Resumen' }

type Props = { searchParams: Promise<{ rango?: string; orden?: string }> }
type Orden = 'vistas' | 'pedidas' | 'conversion'

const num = (n: number) => n.toLocaleString('es-EC')

export default async function Resumen({ searchParams }: Props) {
  const p = await searchParams
  const rango: Rango = RANGOS.some(r => r.valor === p.rango) ? (p.rango as Rango) : 'drop'
  const orden: Orden = p.orden === 'pedidas' || p.orden === 'conversion' ? p.orden : 'vistas'
  const e = await estadisticas(rango)
  const { kpis } = e
  const url = (cambios: { rango?: Rango; orden?: Orden }) => {
    const s = new URLSearchParams({ rango: cambios.rango ?? rango, orden: cambios.orden ?? orden })
    return `/admin/resumen?${s}`
  }
  const variacion = kpis.visitasAnterior ? Math.round(((kpis.visitas - kpis.visitasAnterior) / kpis.visitasAnterior) * 100) : null

  return (
    <div className="space-y-5">
      <PageHeader titulo="Resumen" subtitulo="Qué miran, qué agregan y qué piden tus clientes.">
        <nav aria-label="Rango" className="flex gap-1 rounded-xl border border-line-dark bg-white p-1">
          {RANGOS.map(r => (
            <Link key={r.valor} href={url({ rango: r.valor })} aria-current={r.valor === rango ? 'page' : undefined}
              className={`rounded-lg px-3.5 py-2 text-[13px] font-semibold ${r.valor === rango ? 'bg-navy-950 text-white' : 'text-navy-950 hover:bg-admin-bg'}`}>
              {r.valor === 'drop' && rango === 'drop' ? e.rango.etiqueta : r.etiqueta}
            </Link>
          ))}
        </nav>
      </PageHeader>
      <p className="-mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-800">
        <ShieldCheck size={13} aria-hidden /> Sin cookies · datos en tu servidor
      </p>

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi etiqueta="Visitas" valor={num(kpis.visitas)} icono={Eye} nota={variacion === null ? 'Sin período anterior para comparar' : `${variacion >= 0 ? '+' : ''}${variacion} % vs. período anterior`} positivo={variacion !== null && variacion >= 0} />
        <Kpi etiqueta="Visitantes únicos" valor={num(kpis.visitantes)} icono={Users} nota="Aproximado: se cuenta por día" />
        <Kpi etiqueta="Agregados al carrito" valor={num(kpis.carrito)} icono={ShoppingBag} nota={`${porcentaje(kpis.carrito, kpis.visitas)} de las visitas`} />
        <Kpi etiqueta="Pedidos enviados" valor={num(kpis.pedidos)} icono={MessageCircle} nota={`${porcentaje(kpis.pedidos, kpis.visitantes)} de los visitantes`} />
        <Kpi etiqueta="Reservas pagadas" valor={num(kpis.reservasPagadas)} icono={BadgeCheck} nota={`${porcentaje(kpis.reservasPagadas, kpis.pedidos)} de los pedidos`} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <Card className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-navy-950">Visitas por día · {e.rango.etiqueta}</h2>
              <p className="text-xs text-ink-soft">Pasa el mouse sobre una barra para ver el día.</p>
            </div>
            <div className="flex gap-3.5 text-xs text-ink-soft">
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-navy-800" />Visitas</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-whatsapp" />Pedidos</span>
            </div>
          </div>
          <Grafico serie={e.serie} />
        </Card>

        <div className="space-y-5">
          <Fuentes fuentes={e.fuentes} />
          <Card className="space-y-2.5 p-5">
            <h2 className="font-bold text-navy-950">Celular vs. computadora</h2>
            <div className="flex h-3 overflow-hidden rounded-full bg-sky">
              <div className="bg-navy-950" style={{ width: `${(e.dispositivos.celular / Math.max(1, e.dispositivos.celular + e.dispositivos.computadora)) * 100}%` }} />
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="font-semibold text-navy-950">Celular {porcentaje(e.dispositivos.celular, e.dispositivos.celular + e.dispositivos.computadora)}</span>
              <span className="text-ink-soft">Computadora {porcentaje(e.dispositivos.computadora, e.dispositivos.celular + e.dispositivos.computadora)}</span>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <TopCamisetas top={e.top} orden={orden} url={url} conversionPromedio={kpis.visitas ? kpis.pedidos / kpis.visitas : 0} />
        <Card className="flex flex-col">
          <CardHeader titulo="Lo que buscan y no tienes" subtitulo="Ideas para el próximo drop" />
          {e.busquedasVacias.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-soft">Todavía no hay búsquedas sin resultado.</p>
          ) : (
            <ul className="px-5 py-1.5">
              {e.busquedasVacias.map(b => (
                <li key={b.termino} className="flex items-center gap-2.5 border-b border-line-dark py-3 last:border-0">
                  <SearchX size={15} className="text-[#8a97b8]" aria-hidden />
                  <span className="flex-1 text-sm font-semibold text-navy-950">«{b.termino}»</span>
                  <span className="rounded-full bg-[#eef3fa] px-2 py-0.5 text-[11px] font-semibold text-navy-800">{b.veces} {b.veces === 1 ? 'vez' : 'veces'}</span>
                </li>
              ))}
            </ul>
          )}
          {e.busquedasVacias.some(b => /nino|nina|infantil/.test(b.termino)) && (
            <p className="mt-auto flex items-center gap-2 bg-sky-soft px-5 py-3 text-xs text-navy-800">
              <Info size={14} aria-hidden /> Buscan camisetas de niño: considera sumar tallas infantiles.
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}

function Kpi({ etiqueta, valor, icono: Icono, nota, positivo }: { etiqueta: string; valor: string; icono: typeof Eye; nota: string; positivo?: boolean }) {
  return (
    <Card className="space-y-2 p-[18px]">
      <div className="flex items-center justify-between">
        <p className="kicker text-[10px] text-ink-soft">{etiqueta}</p>
        <Icono size={16} className="text-[#8a97b8]" aria-hidden />
      </div>
      <p className="display text-4xl text-navy-950">{valor}</p>
      <p className={`text-xs ${positivo ? 'font-semibold text-green-800' : 'text-ink-soft'}`}>{nota}</p>
    </Card>
  )
}

function Grafico({ serie }: { serie: Estadisticas['serie'] }) {
  const max = Math.max(1, ...serie.map(d => d.visitas + d.pedidos * 4))
  const ultimos = serie.length - 5
  const fecha = (f: string) => new Date(`${f}T12:00:00-05:00`).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' }).replace('.', '').toUpperCase()
  const marcas = serie.length > 1 ? [0, Math.floor(serie.length / 3), Math.floor((2 * serie.length) / 3), serie.length - 1] : [0]
  return (
    <figure>
      <div className="flex h-56 items-end gap-1" role="img" aria-label={`Visitas por día: máximo ${Math.max(...serie.map(d => d.visitas))} en un día`}>
        {serie.map((d, i) => (
          <div key={d.fecha} title={`${fecha(d.fecha)} · ${d.visitas} visitas · ${d.pedidos} pedidos`} className="flex h-full flex-1 flex-col justify-end gap-0.5">
            {d.pedidos > 0 && <div className="rounded-sm bg-whatsapp" style={{ height: `${(d.pedidos * 4 / max) * 100}%` }} />}
            <div className={`rounded-t-[3px] ${i >= ultimos && serie.length > 7 ? 'bg-navy-800' : 'bg-navy-800/55'}`} style={{ height: `${(d.visitas / max) * 100}%`, minHeight: d.visitas ? 2 : 0 }} />
          </div>
        ))}
      </div>
      <figcaption className="mt-3 flex justify-between font-mono text-[9px] tracking-[0.12em] text-ink-soft">
        {marcas.map(i => <span key={i}>{fecha(serie[i].fecha)}</span>)}
      </figcaption>
    </figure>
  )
}

const FUENTES: Record<'instagram' | 'google' | 'whatsapp_directo' | 'otras', { nombre: string; color: string; Icono: React.ComponentType<{ size?: number; className?: string; color?: string }> }> = {
  instagram: { nombre: 'Instagram', color: '#e1306c', Icono: InstagramLogo },
  whatsapp_directo: { nombre: 'WhatsApp y directo', color: '#4a5a80', Icono: Link2 },
  google: { nombre: 'Google', color: '#1e3a8a', Icono: Search },
  otras: { nombre: 'Facebook y otras', color: '#8a97b8', Icono: FacebookLogo },
}

function Fuentes({ fuentes }: { fuentes: { fuente: Fuente; visitas: number }[] }) {
  const v = (f: Fuente) => fuentes.find(x => x.fuente === f)?.visitas ?? 0
  // WhatsApp casi nunca informa el origen: se muestra junto a «directo».
  const filas = [
    ['instagram', v('instagram')],
    ['whatsapp_directo', v('whatsapp') + v('directo')],
    ['google', v('google')],
    ['otras', v('facebook') + v('otro')],
  ] as const
  const total = filas.reduce((s, [, n]) => s + n, 0)
  return (
    <Card className="space-y-3 p-5">
      <h2 className="font-bold text-navy-950">¿De dónde llegan?</h2>
      {filas.filter(([, n]) => n > 0).map(([clave, n]) => {
        const { nombre, color, Icono } = FUENTES[clave]
        return (
          <div key={clave} className="space-y-1.5">
            <div className="flex justify-between text-[13px]">
              <span className="flex items-center gap-1.5 font-semibold text-navy-950"><Icono size={14} color={color} /> {nombre}</span>
              <span className="font-bold text-navy-950">{porcentaje(n, total)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#eef3fa]"><div className="h-full rounded-full" style={{ width: `${(n / Math.max(1, total)) * 100}%`, background: color }} /></div>
          </div>
        )
      })}
      <p className="flex gap-1.5 rounded-lg bg-admin-bg px-2.5 py-2 text-[11px] leading-snug text-ink-soft">
        <Info size={13} className="mt-px shrink-0" aria-hidden />
        WhatsApp no avisa de dónde viene la visita. Para separarlo, comparte enlaces con ?utm_source=whatsapp.
      </p>
    </Card>
  )
}

function TopCamisetas({ top, orden, url, conversionPromedio }: {
  top: Estadisticas['top']; orden: Orden; url: (c: { orden: Orden }) => string; conversionPromedio: number
}) {
  const filas = [...top].sort((a, b) =>
    orden === 'pedidas' ? b.pedidos - a.pedidos : orden === 'conversion' ? a.pedidos / a.visitas - b.pedidos / b.visitas : b.visitas - a.visitas,
  )
  const maxVisitas = Math.max(1, ...top.map(t => t.visitas))
  const alerta = filas.find(t => convierteMal(t.visitas, t.pedidos, conversionPromedio))
  const ORDENES: [Orden, string][] = [['vistas', 'Más vistas'], ['pedidas', 'Más pedidas'], ['conversion', 'Menor conversión']]

  return (
    <Card className="overflow-hidden">
      <CardHeader titulo="Top camisetas" subtitulo="Del primer clic al pedido: dónde se quedan tus clientes">
        <div className="flex gap-1">
          {ORDENES.map(([o, l]) => (
            <Link key={o} href={url({ orden: o })} className={`rounded-full px-2.5 py-1.5 text-xs font-semibold ${o === orden ? 'bg-navy-950 text-white' : 'bg-admin-bg text-navy-800'}`}>{l}</Link>
          ))}
        </div>
      </CardHeader>
      {filas.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-ink-soft">Aún no hay visitas a camisetas en este período.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead className="bg-[#f8fafd]">
              <tr className="kicker text-[10px] text-ink-soft">
                <th className="py-2.5 pl-5 font-normal">#</th>
                <th className="py-2.5 font-normal">Camiseta</th>
                <th className="py-2.5 font-normal">Visitas</th>
                <th className="py-2.5 font-normal">Carrito</th>
                <th className="py-2.5 font-normal">Pedidos</th>
                <th className="py-2.5 pr-5 font-normal">Conversión</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((t, i) => {
                const mal = convierteMal(t.visitas, t.pedidos, conversionPromedio)
                return (
                  <tr key={t.productoId} className="border-b border-line-dark text-navy-950 last:border-0">
                    <td className={`display py-3 pl-5 text-xl ${i < 3 ? '' : 'text-[#8a97b8]'}`}>{i + 1}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        {t.foto ? <Image src={t.foto} alt="" width={40} height={48} className="h-12 w-10 rounded-md object-cover" /> : <span className="h-12 w-10 rounded-md bg-[#e3ecf8]" />}
                        <div>
                          <p className="text-sm font-semibold">{t.equipo} {t.nombre}</p>
                          <p className="text-xs text-ink-soft">{t.liga} · {t.tipo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 w-20 rounded-full bg-[#eef3fa]"><div className="h-full rounded-full bg-navy-800" style={{ width: `${(t.visitas / maxVisitas) * 100}%` }} /></div>
                        <span className="text-sm font-bold">{num(t.visitas)}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm">{num(t.carrito)}</td>
                    <td className="py-3 text-sm font-bold">{num(t.pedidos)}</td>
                    <td className="py-3 pr-5">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${mal ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>{porcentaje(t.pedidos, t.visitas)}</span>
                        {mal && <TriangleAlert size={15} className="text-amber-600" aria-label="Mucha visita, poca venta" />}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {alerta && (
        <p className="flex items-center gap-2 bg-amber-50 px-5 py-3 text-xs text-amber-800">
          <Lightbulb size={15} aria-hidden /> {alerta.equipo} {alerta.nombre} tiene muchas visitas pero poca venta: revisa la foto o confirma tallas en el chat.
        </p>
      )}
    </Card>
  )
}
