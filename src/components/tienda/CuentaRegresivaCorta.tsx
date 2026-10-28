'use client'

import { useEffect, useState } from 'react'
import { dosDigitos, restante } from '@/lib/domain/drop'

export function CuentaRegresivaCorta({ cierraEn }: { cierraEn: string }) {
  const [ahora, setAhora] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => setAhora(Date.now())
    tick()
    const t = setInterval(tick, 30000)
    return () => clearInterval(t)
  }, [])

  if (ahora === null) return null
  const r = restante(cierraEn, ahora)
  return <span className="kicker font-bold text-sky">{r.dias}D {dosDigitos(r.horas)}H</span>
}
