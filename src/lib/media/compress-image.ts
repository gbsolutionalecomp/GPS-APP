const MAX_DIMENSION_PX = 1600
const JPEG_QUALITY = 0.82

/**
 * Reduce una foto de cámara (que puede pesar varios MB) a un JPEG de ~200-400KB
 * antes de subirla. Con dos fotos por viaje y muchos ingenieros, esto es la diferencia
 * entre caber en el plan de Storage de Supabase o no. Si algo falla, se sube el original.
 */
export async function compressImage(file: File, maxDimension = MAX_DIMENSION_PX, quality = JPEG_QUALITY): Promise<File> {
  if (!file.type.startsWith('image/') || typeof createImageBitmap !== 'function') return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) return file
    context.drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob || blob.size >= file.size) return file
    const name = file.name.replace(/\.\w+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    return file
  }
}
