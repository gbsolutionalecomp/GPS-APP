import { createHmac, timingSafeEqual } from 'node:crypto'
import { DefaultLocateliaAdapter } from '@/integrations/locatelia/adapter'
import type { LocateliaDirectory, NormalizedLocateliaBatch } from '@/integrations/locatelia/contracts'

export function validateLocateliaWebhookSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false
  try {
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
    const sigBuffer = Buffer.from(signature, 'utf8')
    const expBuffer = Buffer.from(expected, 'utf8')
    return sigBuffer.length === expBuffer.length && timingSafeEqual(sigBuffer, expBuffer)
  } catch {
    return false
  }
}

export async function processLocateliaBatch(
  records: Record<string, unknown>[],
  directory: LocateliaDirectory
): Promise<NormalizedLocateliaBatch> {
  const adapter = new DefaultLocateliaAdapter()
  return adapter.normalize(records, directory)
}
