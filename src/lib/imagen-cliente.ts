'use client'

// Convierte la imagen en el navegador antes de subirla: pesa mucho menos y el plan
// gratis de Supabase rinde más. WebP conserva la transparencia (escudos).

export type Formato =
  | { tipo: 'ancho'; ancho: number } // fotos de camisetas: ancho máximo
  | { tipo: 'cuadrado'; lado: number } // círculo de liga: recorte cuadrado al centro
  | { tipo: 'caja'; lado: number } // escudo: entra completo en un cuadrado, sin recortar

export async function aWebp(archivo: File, formato: Formato, calidad = 0.85): Promise<Blob> {
  const img = await createImageBitmap(archivo)
  const lienzo = document.createElement('canvas')
  const ctx = lienzo.getContext('2d')!

  if (formato.tipo === 'cuadrado') {
    const lado = Math.min(img.width, img.height)
    lienzo.width = lienzo.height = Math.min(formato.lado, lado)
    ctx.drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, lienzo.width, lienzo.height)
  } else {
    const max = formato.tipo === 'ancho' ? formato.ancho / img.width : Math.min(formato.lado / img.width, formato.lado / img.height)
    const escala = Math.min(1, max)
    lienzo.width = Math.round(img.width * escala)
    lienzo.height = Math.round(img.height * escala)
    ctx.drawImage(img, 0, 0, lienzo.width, lienzo.height)
  }
  img.close()

  const blob = await new Promise<Blob | null>(r => lienzo.toBlob(r, 'image/webp', calidad))
  if (!blob || blob.type !== 'image/webp') throw new Error('Este navegador no puede convertir la imagen. Usa Chrome o un celular actualizado.')
  return blob
}
