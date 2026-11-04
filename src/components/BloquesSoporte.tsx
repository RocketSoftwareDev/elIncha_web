import { aBloques } from '@/lib/domain/soporte'

/**
 * Texto de una sección de soporte ya convertido en párrafos, listas y tablas.
 * React escapa todo el texto: lo que escriba el admin nunca se ejecuta como HTML.
 */
export function BloquesSoporte({ contenido, claro = false }: { contenido: string; claro?: boolean }) {
  const borde = claro ? 'border-line-dark' : 'border-line'
  const suave = claro ? 'text-ink-soft' : 'text-[#d6def0]'
  return (
    <div className="space-y-4">
      {aBloques(contenido).map((b, i) => {
        if (b.tipo === 'parrafo') return <p key={i} className={`text-[15px] leading-relaxed ${suave}`}>{b.texto}</p>
        if (b.tipo === 'lista') {
          return (
            <ul key={i} className={`space-y-2 text-[15px] ${suave}`}>
              {b.items.map((t, k) => (
                <li key={k} className="flex gap-3"><span className={`mt-2 size-1.5 shrink-0 ${claro ? 'bg-navy-800' : 'bg-sky'}`} aria-hidden />{t}</li>
              ))}
            </ul>
          )
        }
        return (
          <div key={i} className={`overflow-x-auto border ${borde}`}>
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead className={claro ? 'bg-[#f8fafd]' : 'bg-navy-900'}>
                <tr>{b.cabecera.map((c, k) => <th key={k} scope="col" className={`kicker px-4 py-3 text-[11px] font-bold ${claro ? 'text-ink-soft' : 'text-sky'}`}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {b.filas.map((f, k) => (
                  <tr key={k} className={`border-t ${borde}`}>
                    {f.map((c, j) => <td key={j} className={`px-4 py-3 ${j === 0 ? 'font-bold' : suave}`}>{c}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}
