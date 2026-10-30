import { repo } from '@/lib/data/repo'

// La llama una tarea de GitHub cada 3 días: así Supabase gratis no se pausa
// por inactividad (se pausa tras 7 días sin uso). No expone ningún dato.
export async function GET() {
  try {
    await repo.ping()
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ ok: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
