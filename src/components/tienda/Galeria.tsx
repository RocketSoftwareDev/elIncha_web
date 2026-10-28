'use client'

import Image from 'next/image'
import { useState } from 'react'

export function Galeria({ fotos, alt }: { fotos: string[]; alt: string }) {
  const [i, setI] = useState(0)
  return (
    <div className="flex flex-1 flex-col-reverse gap-4 md:flex-row">
      {fotos.length > 1 && (
        <div className="no-scrollbar flex gap-3 overflow-x-auto md:flex-col">
          {fotos.map((f, k) => (
            <button
              key={f + k}
              type="button"
              onClick={() => setI(k)}
              aria-label={`Ver foto ${k + 1}`}
              aria-current={k === i ? 'true' : undefined}
              className={`relative h-[110px] w-[88px] shrink-0 overflow-hidden bg-navy-800 ${k === i ? 'ring-2 ring-sky' : 'ring-1 ring-line'}`}
            >
              <Image src={f} alt="" fill sizes="88px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="relative aspect-[4/5] flex-1 overflow-hidden bg-navy-800 lg:aspect-auto lg:min-h-[720px]">
        <Image src={fotos[i]} alt={alt} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
      </div>
    </div>
  )
}
