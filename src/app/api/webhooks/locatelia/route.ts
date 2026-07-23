import { type NextRequest } from 'next/server'
import { apiError, apiSuccess } from '@/lib/api-response'
import { validateLocateliaWebhookSignature, processLocateliaBatch } from '@/lib/locatelia'
import { getAppSnapshot } from '@/data/server-snapshot'

export async function POST(req: NextRequest) {
  const secret = process.env.LOCATELIA_WEBHOOK_SECRET
  const signature = req.headers.get('x-locatelia-signature')

  const rawBody = await req.text()

  if (secret && !validateLocateliaWebhookSignature(rawBody, signature, secret)) {
    return apiError('Firma de webhook de Locatelia inválida', 401)
  }

  let payload: Record<string, unknown> | Record<string, unknown>[]
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return apiError('Cuerpo JSON inválido', 400)
  }

  const records = Array.isArray(payload) ? payload : [payload]
  const snapshot = await getAppSnapshot()
  const directory = { vehicles: snapshot.vehicles }

  const result = await processLocateliaBatch(records, directory)

  return apiSuccess({
    processed: result.journeys.length,
    warnings: result.warnings,
    errors: result.errors,
  })
}
