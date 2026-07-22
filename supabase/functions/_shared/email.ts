const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export interface EmailInput {
  to: string
  subject: string
  html: string
}

/** Envío best-effort: sin RESEND_API_KEY/NOTIFICATIONS_FROM_EMAIL configurados, no hace nada. */
export async function sendEmail(input: EmailInput): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('NOTIFICATIONS_FROM_EMAIL')
  if (!apiKey || !from) return
  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from, to: input.to, subject: input.subject, html: input.html }),
  })
  if (!response.ok) throw new Error(`No fue posible enviar el correo (${response.status}).`)
}
