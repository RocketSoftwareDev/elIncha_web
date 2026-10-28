import { redirect } from 'next/navigation'

// La portada del admin es el Resumen con las estadísticas.
export default function AdminInicio() {
  redirect('/admin/resumen')
}
