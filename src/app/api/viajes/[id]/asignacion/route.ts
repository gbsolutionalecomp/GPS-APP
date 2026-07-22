import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authorizeAdmin } from '@/lib/authorization'
import { sendEmail } from '@/lib/notifications/email'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const bodySchema = z.object({ projectId: z.string().uuid(), engineerId: z.string().uuid() })

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeAdmin()
  if (!authorization.ok) return authorization.response
  const { id } = await params
  try {
    const input = bodySchema.parse(await request.json())
    const supabase = await getSupabaseServerClient()
    const { error } = await supabase.from('journeys').update({ project_id: input.projectId, engineer_id: input.engineerId }).eq('id', id)
    if (error) throw error
    const [journey, engineer, project] = await Promise.all([
      supabase.from('journeys').select('origin, destination, actual_start').eq('id', id).maybeSingle(),
      supabase.from('profiles').select('full_name, email').eq('id', input.engineerId).maybeSingle(),
      supabase.from('projects').select('code, name').eq('id', input.projectId).maybeSingle(),
    ])
    if (engineer.data?.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || ''
      const route = journey.data?.origin && journey.data?.destination ? `${journey.data.origin} → ${journey.data.destination}` : 'un recorrido'
      const projectLabel = project.data ? `${project.data.code} · ${project.data.name}` : 'proyecto pendiente'
      await sendEmail({
        to: engineer.data.email,
        subject: 'Nuevo viaje asignado · GBS Control de Viajes',
        html: `<p>Hola ${engineer.data.full_name ?? ''},</p><p>Se te asignó ${route} (${projectLabel}). Sube las fotografías del odómetro inicial y final, con su lectura en kilómetros, en cuanto termines el recorrido.</p><p><a href="${appUrl}/mis-viajes">Ir a Mis viajes</a></p>`,
      }).catch((cause) => console.error('No fue posible notificar al ingeniero por correo:', cause))
    }
    return NextResponse.json({ ok: true })
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : 'No fue posible asignar el viaje.' }, { status: 422 })
  }
}
