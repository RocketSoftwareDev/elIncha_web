'use client'

import { useEffect, useState } from 'react'
import { dosDigitos, restante } from '@/lib/domain/drop'

/** «2D : 07H : 14M». Parte de la hora del servidor y se anima en el navegador. */
export function CuentaRegresiva({ cierraEn, ahoraServidor, className }: { cierraEn: string; ahoraServidor: number; className?: string }) {
  const [ahora, setAhora] = useState(ahoraServidor)

  useEffect(() => {
    const desfase = Date.now() - ahoraServidor
    const id = setInterval(() => setAhora(Date.now() - desfase), 30000)
    return () => clearInterval(id)
  }, [ahoraServidor])

  const r = restante(cierraEn, ahora)
  return (
    <span className={className} suppressHydrationWarning>
      {r.terminado ? 'CERRADO' : `${r.dias}D : ${dosDigitos(r.horas)}H : ${dosDigitos(r.minutos)}M`}
    </span>
  )
}
