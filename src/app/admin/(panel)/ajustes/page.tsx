import { requerirAdmin } from '@/lib/auth/sesion'
import type { Metadata } from 'next'
import { FacebookLogo, InstagramLogo, TiktokLogo, WhatsappLogo } from '@phosphor-icons/react/dist/ssr'
import { Banknote, Clock3, DollarSign, Landmark, Smartphone, type LucideIcon } from 'lucide-react'
import { guardarAjustesAccion } from '@/app/admin/acciones'
import { BotonEnviar, FormAccion } from '@/components/admin/FormAccion'
import { Campo, Card, Interruptor, PageHeader, boton, input } from '@/components/admin/ui'
import { leerAjustes } from '@/lib/data/admin'
import { formatoPrecio } from '@/lib/domain/pricing'

export const metadata: Metadata = { title: 'Ajustes y pagos' }

const ICONO_PAGO: Record<string, LucideIcon> = { transferencia: Landmark, deuna: Smartphone, efectivo: Banknote }

function ConIcono({ icono, children }: { icono: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="relative block">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft">{icono}</span>
      {children}
    </span>
  )
}

export default async function AjustesPage() {
  // El layout no basta: Next genera la página en paralelo. Se verifica aquí también.
  await requerirAdmin()
  const a = await leerAjustes()
  const activos = a.metodosPago.filter(m => m.activo).map(m => m.nombre.split(' /')[0])

  return (
    <FormAccion accion={guardarAjustesAccion} className="space-y-5">
      <PageHeader titulo="Ajustes y pagos" subtitulo="Todo lo que escribas aquí es lo que lee el cliente en la web.">
        <BotonEnviar className={boton.oscuro}>Guardar cambios</BotonEnviar>
      </PageHeader>

      <div className="grid gap-5 xl:grid-cols-[1fr_440px]">
        <div className="min-w-0 space-y-5">
          <Card className="space-y-3.5 p-5">
            <h2 className="text-base font-bold">WhatsApp de pedidos</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo label="Número">
                <ConIcono icono={<WhatsappLogo size={16} aria-hidden />}>
                  <input name="whatsapp" defaultValue={a.whatsapp} required inputMode="tel" className={`${input} pl-9`} />
                </ConIcono>
              </Campo>
              <Campo label="Horario de atención">
                <ConIcono icono={<Clock3 size={16} aria-hidden />}>
                  <input name="horario" defaultValue={a.horario} required className={`${input} pl-9`} />
                </ConIcono>
              </Campo>
            </div>
            <Campo label="Saludo del mensaje">
              <input name="saludo" defaultValue={a.saludo} required maxLength={120} className={input} />
            </Campo>
          </Card>

          <Card className="space-y-3.5 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Formas de pago</h2>
              <p className="text-xs text-ink-soft">Se coordinan por WhatsApp</p>
            </div>
            <ul className="space-y-2">
              {a.metodosPago.map(m => {
                const Icono = ICONO_PAGO[m.id] ?? Landmark
                return (
                  <li key={m.id} className="flex items-center gap-3 rounded-xl border border-line-dark p-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-soft"><Icono size={18} className="text-navy-800" aria-hidden /></span>
                    <div className="flex-1">
                      <Interruptor name={`pago_${m.id}`} defaultChecked={m.activo} label={m.nombre} ayuda={m.detalle} />
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo label="Reserva para confirmar">
                <ConIcono icono={<DollarSign size={16} aria-hidden />}>
                  <input name="montoReserva" type="number" min={0} step="0.5" defaultValue={a.montoReserva} required className={`${input} pl-9`} />
                </ConIcono>
              </Campo>
              <Campo label="Saldo">
                <span className={`${input} text-ink-soft`}>Se coordina por WhatsApp</span>
              </Campo>
            </div>
          </Card>

          <Card className="space-y-3.5 p-5">
            <h2 className="text-base font-bold">Redes sociales</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <Campo label="Instagram"><ConIcono icono={<InstagramLogo size={16} aria-hidden />}><input name="instagram" defaultValue={a.redes.instagram} required className={`${input} pl-9`} /></ConIcono></Campo>
              <Campo label="TikTok"><ConIcono icono={<TiktokLogo size={16} aria-hidden />}><input name="tiktok" defaultValue={a.redes.tiktok} required className={`${input} pl-9`} /></ConIcono></Campo>
              <Campo label="Facebook"><ConIcono icono={<FacebookLogo size={16} aria-hidden />}><input name="facebook" defaultValue={a.redes.facebook} required className={`${input} pl-9`} /></ConIcono></Campo>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Texto «Cómo comprar»</h2>
              <span className="kicker text-[10px] text-ink-soft">{a.pasosComoComprar.length} pasos</span>
            </div>
            {a.pasosComoComprar.map((paso, i) => (
              <label key={i} className="flex items-start gap-2.5">
                <span className="mt-1 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-navy-950 text-xs font-bold text-sky">{i + 1}</span>
                <span className="sr-only">Paso {i + 1}</span>
                <textarea name={`paso_${i}`} defaultValue={paso} required rows={2} maxLength={160} className={`${input} resize-none text-[13px] leading-snug`} />
              </label>
            ))}
          </Card>

          <section className="space-y-3.5 rounded-2xl bg-navy-950 p-5 text-white">
            <p className="kicker text-[10px] text-sky">Vista previa · web del cliente</p>
            <h2 className="display text-[30px]">¿Cómo pago?</h2>
            <p className="text-[13px] leading-relaxed text-[#d6def0]">
              {activos.join(' o ')}. Reservas con {formatoPrecio(a.montoReserva)} y el resto lo coordinamos por WhatsApp.
            </p>
            <span className="inline-flex items-center gap-2 bg-whatsapp px-3.5 py-2.5 font-mono text-xs font-bold tracking-wider text-navy-950">
              <WhatsappLogo size={16} weight="fill" aria-hidden /> ESCRÍBENOS
            </span>
          </section>
        </div>
      </div>
    </FormAccion>
  )
}
