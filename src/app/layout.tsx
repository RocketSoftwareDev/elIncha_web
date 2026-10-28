import type { Metadata, Viewport } from 'next'
import { Anton, Archivo, Permanent_Marker, Saira_Condensed, Space_Mono } from 'next/font/google'
import './globals.css'

const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-anton', display: 'swap' })
const archivo = Archivo({ subsets: ['latin'], variable: '--font-archivo', display: 'swap' })
const spaceMono = Space_Mono({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-space-mono', display: 'swap' })
const marker = Permanent_Marker({ weight: '400', subsets: ['latin'], variable: '--font-marker', display: 'swap' })
// Fuente libre para la vista previa del dorsal: tiene Ñ, tildes y apóstrofe.
const saira = Saira_Condensed({ weight: ['700'], subsets: ['latin'], variable: '--font-saira', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'El Hincha · Camisetas de fútbol en Machala', template: '%s · El Hincha' },
  description: 'Camisetas de clubes, selecciones y retro con tu nombre y número. Bajo pedido por drops, entrega en Machala y El Oro.',
  icons: { icon: '/brand/logo-navy.svg' },
}

export const viewport: Viewport = { themeColor: '#050d24' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${anton.variable} ${archivo.variable} ${spaceMono.variable} ${marker.variable} ${saira.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  )
}
