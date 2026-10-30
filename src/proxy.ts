import { NextResponse, type NextRequest } from 'next/server'

// Revisión rápida: sin cookie de sesión, al login. NO es la protección real:
// cada página y acción del admin verifica la firma con requerirAdmin().
export function proxy(req: NextRequest) {
  const conClave = !!process.env.ADMIN_PASSWORD_HASH
  if (conClave && !req.cookies.has('eh_admin') && req.nextUrl.pathname !== '/admin/login') {
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }
  return NextResponse.next()
}

export const config = { matcher: ['/admin/:path*'] }
