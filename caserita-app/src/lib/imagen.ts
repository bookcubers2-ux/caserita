/**
 * Achica la captura del comprobante antes de mandarla: una captura de
 * celular pesa 1 a 4 MB; a 1280 px y JPEG 0,82 queda en 150 a 300 KB, que
 * Telegram muestra igual de legible y entra holgado en el límite del servidor.
 */
export async function comprimirImagen(archivo: File, maxLado = 1280, calidad = 0.82): Promise<string> {
  const url = URL.createObjectURL(archivo)
  try {
    const img = await new Promise<HTMLImageElement>((resolver, rechazar) => {
      const i = new Image()
      i.onload = () => resolver(i)
      i.onerror = () => rechazar(new Error('No pudimos leer la imagen'))
      i.src = url
    })
    const escala = Math.min(1, maxLado / Math.max(img.width, img.height))
    const ancho = Math.max(1, Math.round(img.width * escala))
    const alto = Math.max(1, Math.round(img.height * escala))
    const lienzo = document.createElement('canvas')
    lienzo.width = ancho
    lienzo.height = alto
    const ctx = lienzo.getContext('2d')
    if (!ctx) throw new Error('Este navegador no permite procesar la imagen')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, ancho, alto)
    ctx.drawImage(img, 0, 0, ancho, alto)
    return lienzo.toDataURL('image/jpeg', calidad)
  } finally {
    URL.revokeObjectURL(url)
  }
}
