'use client'

import { useEffect, useState } from 'react'
import { dosDigitos, restante } from '@/lib/domain/drop'

/** Cuenta regresiva del cierre del drop. Sin drop abierto muestra 00 : 00 : 00. */
export function CuentaRegresiva({ cierraEn, ahoraServidor }: { cierraEn: string | null; ahoraServidor: number }) {
  // Corrige la diferencia entre el reloj del celular y el del servidor.
  const [desfase] = useState(() => ahoraServidor - Date.now())
  const [ahora, setAhora] = useState(ahoraServidor)

  useEffect(() => {
    if (!cierraEn) return
    const t = setInterval(() => setAhora(Date.now() + desfase), 1000)
    return () => clearInterval(t)
  }, [cierraEn, desfase])

  const r = cierraEn ? restante(cierraEn, ahora) : { dias: 0, horas: 0, minutos: 0, terminado: true }
  const apagado = !cierraEn || r.terminado
  const bloques = [
    { valor: r.dias, etiqueta: 'Días' },
    { valor: r.horas, etiqueta: 'Horas' },
    { valor: r.minutos, etiqueta: 'Minutos' },
  ]

  return (
    <div className="flex flex-1 items-center gap-2 md:gap-4" role="timer" aria-label={apagado ? 'Sin drop abierto' : `Cierra en ${r.dias} días, ${r.horas} horas y ${r.minutos} minutos`}>
      {bloques.map((b, i) => (
        <div key={b.etiqueta} className="contents">
          {i > 0 && <span className={`display text-4xl md:text-8xl ${apagado ? 'text-white/20' : 'text-sky'}`} aria-hidden>:</span>}
          <div className="flex-1 border border-line bg-navy-950/50 px-3 py-4 md:px-8 md:py-6">
            <div className={`display text-6xl tabular-nums md:text-[140px] ${apagado ? 'text-white/25' : 'text-white'}`}>{dosDigitos(b.valor)}</div>
            <div className={`kicker mt-1 text-[10px] md:text-xs ${apagado ? 'text-white/35' : 'text-sky'}`}>{b.etiqueta}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
