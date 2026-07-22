export interface ImageMetadata {
  byteSize: number
  mimeType: string
  widthPx?: number
  heightPx?: number
  sha256?: string
}

async function readDimensions(file: File): Promise<{ widthPx?: number; heightPx?: number }> {
  if (typeof createImageBitmap !== 'function') return {}
  try {
    const bitmap = await createImageBitmap(file)
    const dimensions = { widthPx: bitmap.width, heightPx: bitmap.height }
    bitmap.close?.()
    return dimensions
  } catch {
    return {}
  }
}

async function sha256Hex(file: File): Promise<string | undefined> {
  if (typeof crypto === 'undefined' || !crypto.subtle) return undefined
  try {
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  } catch {
    return undefined
  }
}

/** Metadatos que se guardan junto a cada foto: tamaño, tipo, dimensiones y huella para detectar duplicados. */
export async function readImageMetadata(file: File): Promise<ImageMetadata> {
  const [dimensions, sha256] = await Promise.all([readDimensions(file), sha256Hex(file)])
  return { byteSize: file.size, mimeType: file.type, ...dimensions, sha256 }
}
