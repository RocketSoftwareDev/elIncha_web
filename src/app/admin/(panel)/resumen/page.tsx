import { redirect } from 'next/navigation'

// El resumen todavía no tiene pantalla propia: por ahora es la de Drops.
export default function Resumen() {
  redirect('/admin/drops')
}
