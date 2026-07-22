const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export interface EmailInput {
  to: string
  subject: string
  html: string
}

/**
 * Envío best-effort: sin RESEND_API_KEY/NOTIFICATIONS_FROM_EMAIL (demo/local) no hace nada,
 * para no romper el flujo principal por falta de credenciales de correo.
 */
export async function sendEmail(input: EmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.NOTIFICATIONS_FROM_EMAIL?.trim()
  if (!apiKey || !from) return
  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from, to: input.to, subject: input.subject, html: input.html }),
  })
  if (!response.ok) throw new Error(`No fue posible enviar el correo (${response.status}).`)
}
