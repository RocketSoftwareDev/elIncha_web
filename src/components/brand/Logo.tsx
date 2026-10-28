import Image from 'next/image'

/** Logo vectorizado de El Hincha. «blanco» para fondos navy, «navy» para fondos claros. */
export function Logo({ variante = 'blanco', alto = 56, className }: { variante?: 'blanco' | 'navy'; alto?: number; className?: string }) {
  return (
    <Image
      src={`/brand/logo-${variante}.svg`}
      alt="El Hincha · Machala"
      width={Math.round((alto * 220) / 292)}
      height={alto}
      priority
      className={className}
    />
  )
}
