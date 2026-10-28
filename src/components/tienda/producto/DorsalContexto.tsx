'use client'

import { createContext, useContext, useState } from 'react'

// Nombre y número que escribe el cliente. Los comparten el formulario y la
// galería: la primera imagen de la galería es la vista previa en vivo.

interface Dorsal {
  nombre: string
  numero: string
  personalizar: boolean
  diapositiva: number
  setNombre: (v: string) => void
  setNumero: (v: string) => void
  setPersonalizar: (v: boolean) => void
  setDiapositiva: (i: number) => void
}

const Contexto = createContext<Dorsal | null>(null)

export function DorsalProvider({ personalizable, children }: { personalizable: boolean; children: React.ReactNode }) {
  const [nombre, setNombreBase] = useState('')
  const [numero, setNumeroBase] = useState('')
  const [personalizar, setPersonalizar] = useState(personalizable)
  const [diapositiva, setDiapositiva] = useState(0)

  // Al escribir, la galería vuelve a la vista previa para que se vea el cambio.
  const setNombre = (v: string) => { setNombreBase(v); setDiapositiva(0) }
  const setNumero = (v: string) => { setNumeroBase(v); setDiapositiva(0) }

  return (
    <Contexto.Provider value={{ nombre, numero, personalizar, diapositiva, setNombre, setNumero, setPersonalizar, setDiapositiva }}>
      {children}
    </Contexto.Provider>
  )
}

export function useDorsal(): Dorsal {
  const c = useContext(Contexto)
  if (!c) throw new Error('useDorsal fuera de DorsalProvider')
  return c
}
