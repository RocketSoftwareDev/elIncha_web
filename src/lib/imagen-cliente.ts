'use client'

// Convierte la imagen en el navegador antes de subirla: pesa mucho menos y el plan
// gratis de Supabase rinde más. WebP conserva la transparencia (escudos).

export type Formato =
  | { tipo: 'ancho'; ancho: number } // fotos de camisetas: ancho máximo
  | { tipo: 'cuadrado'; lado: number } // círculo de liga: recorte cuadrado al centro
  | { tipo: 'caja'; lado: number } // entra completo en un cuadrado, sin recortar
  | { tipo: 'logo'; lado: number } // escudos y logos de liga: todos del mismo tamaño y centrados

/** Margen igual para todos los logos (fracción del lado). */
const MARGEN_LOGO = 0.1

export async function aWebp(archivo: File, formato: Formato, calidad = 0.85): Promise<Blob> {
  const img = await cargarImagen(archivo)
  const lienzo = document.createElement('canvas')
  const ctx = lienzo.getContext('2d')!

  try {
    if (formato.tipo === 'logo') {
      const recorte = recortarLogo(img)
      lienzo.width = lienzo.height = formato.lado
      const util = formato.lado * (1 - 2 * MARGEN_LOGO)
      const escala = util / Math.max(recorte.width, recorte.height)
      const w = recorte.width * escala, h = recorte.height * escala
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(recorte, (formato.lado - w) / 2, (formato.lado - h) / 2, w, h)
    } else if (formato.tipo === 'cuadrado') {
      const lado = Math.min(img.width, img.height)
      lienzo.width = lienzo.height = Math.min(formato.lado, lado)
      ctx.drawImage(img.fuente, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, lienzo.width, lienzo.height)
    } else {
      const max = formato.tipo === 'ancho' ? formato.ancho / img.width : Math.min(formato.lado / img.width, formato.lado / img.height)
      const escala = Math.min(1, max)
      lienzo.width = Math.round(img.width * escala)
      lienzo.height = Math.round(img.height * escala)
      ctx.drawImage(img.fuente, 0, 0, lienzo.width, lienzo.height)
    }
  } finally {
    img.liberar()
  }

  const webp = await convertirLienzo(lienzo, 'image/webp', calidad)
  if (webp?.type === 'image/webp') return webp

  // Algunos iPhone pueden abrir HEIC/JPG, pero su Safari no exporta canvas a WebP.
  // Se envía un formato que sí soporte y el servidor lo convierte a WebP antes de guardarlo.
  const tipoRespaldo = formato.tipo === 'logo' ? 'image/png' : 'image/jpeg'
  const respaldo = await convertirLienzo(lienzo, tipoRespaldo, calidad)
  if (!respaldo) throw new Error('Este celular no pudo preparar la imagen. Intenta elegirla desde Fotos o usa JPG/PNG.')
  return respaldo
}

function convertirLienzo(lienzo: HTMLCanvasElement, tipo: string, calidad: number) {
  return new Promise<Blob | null>(resolve => lienzo.toBlob(resolve, tipo, calidad))
}

interface ImagenCargada {
  fuente: CanvasImageSource
  width: number
  height: number
  liberar: () => void
}

/** Safari/iPhone no siempre ofrece createImageBitmap, aunque sí pueda abrir la foto. */
async function cargarImagen(archivo: File): Promise<ImagenCargada> {
  if ('createImageBitmap' in globalThis) {
    try {
      const bitmap = await createImageBitmap(archivo)
      return { fuente: bitmap, width: bitmap.width, height: bitmap.height, liberar: () => bitmap.close() }
    } catch {
      // El elemento <img> de Safari puede decodificar formatos que createImageBitmap rechaza.
    }
  }

  const url = URL.createObjectURL(archivo)
  const imagen = new Image()
  try {
    imagen.src = url
    await new Promise<void>((resolve, reject) => {
      imagen.onload = () => resolve()
      imagen.onerror = () => reject(new Error('Este celular no puede leer el formato de la foto. Prueba con JPG, PNG o WebP.'))
    })
    return { fuente: imagen, width: imagen.naturalWidth, height: imagen.naturalHeight, liberar: () => URL.revokeObjectURL(url) }
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}

/**
 * Deja solo el logo: si la imagen trae fondo liso (blanco u otro color, típico de un
 * JPG), lo vuelve transparente desde los bordes hacia adentro (sin tocar los blancos
 * DENTRO del escudo) y luego corta todo el espacio vacío alrededor.
 */
function recortarLogo(img: ImagenCargada): HTMLCanvasElement {
  const escala = Math.min(1, 800 / Math.max(img.width, img.height))
  const W = Math.max(1, Math.round(img.width * escala)), H = Math.max(1, Math.round(img.height * escala))
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img.fuente, 0, 0, W, H)
  const datos = ctx.getImageData(0, 0, W, H)
  const px = datos.data

  // ¿Fondo liso? Las 4 esquinas opacas y de un color parecido.
  const esquina = (x: number, y: number) => (y * W + x) * 4
  const esquinas = [esquina(0, 0), esquina(W - 1, 0), esquina(0, H - 1), esquina(W - 1, H - 1)]
  const [r0, g0, b0] = [px[esquinas[0]], px[esquinas[0] + 1], px[esquinas[0] + 2]]
  const parecido = (i: number, tol: number) => Math.abs(px[i] - r0) + Math.abs(px[i + 1] - g0) + Math.abs(px[i + 2] - b0) <= tol
  const fondoLiso = esquinas.every(i => px[i + 3] > 250 && parecido(i, 60))

  if (fondoLiso) {
    // Relleno desde los bordes: solo se borra el fondo conectado con el exterior.
    const visto = new Uint8Array(W * H)
    const pila: number[] = []
    for (let x = 0; x < W; x++) pila.push(x, (H - 1) * W + x)
    for (let y = 0; y < H; y++) pila.push(y * W, y * W + W - 1)
    while (pila.length) {
      const p = pila.pop()!
      if (visto[p]) continue
      visto[p] = 1
      const i = p * 4
      if (px[i + 3] < 16 || !parecido(i, 60)) continue
      px[i + 3] = 0
      const x = p % W, y = (p - x) / W
      if (x > 0) pila.push(p - 1)
      if (x < W - 1) pila.push(p + 1)
      if (y > 0) pila.push(p - W)
      if (y < H - 1) pila.push(p + W)
    }
    ctx.putImageData(datos, 0, 0)
  }

  // Caja del contenido visible.
  let x0 = W, y0 = H, x1 = -1, y1 = -1
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (px[(y * W + x) * 4 + 3] > 16) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  if (x1 < 0) return c // imagen vacía: se usa tal cual
  const r = document.createElement('canvas')
  r.width = x1 - x0 + 1
  r.height = y1 - y0 + 1
  r.getContext('2d')!.drawImage(c, x0, y0, r.width, r.height, 0, 0, r.width, r.height)
  return r
}
