import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // En Netlify su adaptador arma el servidor; la salida standalone es para Docker (VPS).
  output: process.env.NETLIFY ? undefined : 'standalone',
  poweredByHeader: false,
  // Raíz fija: si Next la busca solo, puede tomar la carpeta de arriba y vigilar archivos ajenos.
  turbopack: { root: process.cwd() },
  env: {
    // Netlify define NETLIFY solo durante el build: se fija aquí para usarlo en ejecución.
    EH_EN_NETLIFY: process.env.NETLIFY ? '1' : '',
  },
  images: {
    // Sin optimizador de Next: las fotos ya se suben chicas en WebP, y así no se
    // gastan créditos del plan gratis de Netlify en procesar imágenes.
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // El admin nunca se guarda en caché ni lo indexan buscadores.
        source: '/admin/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ]
  },
}

export default nextConfig
