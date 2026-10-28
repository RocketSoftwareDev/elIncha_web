import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Imagen de Docker mínima: solo el servidor y lo que usa.
  output: 'standalone',
  poweredByHeader: false,
  images: {
    // Las fotos subidas por el admin las sirve el contenedor "media".
    remotePatterns: [{ protocol: 'https', hostname: 'media.elhinchamachala.com' }],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
