'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { registrar } from './registrar'

/** Una vista por página. Las fichas de producto registran la suya con el id del producto. */
export function RegistroVistas() {
  const ruta = usePathname()
  useEffect(() => {
    if (!ruta.startsWith('/producto/')) registrar({ tipo: 'vista', ruta })
  }, [ruta])
  return null
}

export function RegistrarVistaProducto({ productoId, ruta }: { productoId: string; ruta: string }) {
  const hecho = useRef(false)
  useEffect(() => {
    if (hecho.current) return
    hecho.current = true
    registrar({ tipo: 'vista', ruta, productoId })
  }, [productoId, ruta])
  return null
}

/** Lo que buscan y no encuentran en la vitrina: ideas para el próximo drop. */
export function RegistrarBusquedaVacia({ termino, total }: { termino: string; total: number }) {
  useEffect(() => {
    if (!termino || total > 0) return
    // Se busca mientras se escribe: solo cuenta si el término queda quieto un momento.
    const t = setTimeout(() => registrar({ tipo: 'busqueda_vacia', ruta: '/vitrina', termino }), 2000)
    return () => clearTimeout(t)
  }, [termino, total])
  return null
}
