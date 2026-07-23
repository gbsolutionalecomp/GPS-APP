import { sendEmail } from '@/lib/notifications/email'

export async function sendJourneyAssignedEmail(to: string, journey: { id: string; origen: string; destino: string; fecha: string }): Promise<void> {
  const html = `
    <h2>Nuevo Viaje Asignado</h2>
    <p>Se te ha asignado un nuevo viaje en la plataforma GPS-APP:</p>
    <ul>
      <li><strong>ID:</strong> ${journey.id}</li>
      <li><strong>Origen:</strong> ${journey.origen}</li>
      <li><strong>Destino:</strong> ${journey.destino}</li>
      <li><strong>Fecha:</strong> ${journey.fecha}</li>
    </ul>
    <p>Ingresa a la aplicación para subir tus evidencias de odómetro.</p>
  `
  await sendEmail({ to, subject: `[GBS GPS] Viaje Asignado: ${journey.origen} → ${journey.destino}`, html })
}

export async function sendJourneyStartedEmail(to: string, journeyId: string, vehiculo: string): Promise<void> {
  const html = `
    <h2>Viaje Iniciado</h2>
    <p>El viaje <strong>${journeyId}</strong> con la unidad <strong>${vehiculo}</strong> ha sido marcado en curso.</p>
  `
  await sendEmail({ to, subject: `[GBS GPS] Viaje Iniciado: ${vehiculo}`, html })
}

export async function sendJourneyFinishedEmail(to: string, journeyId: string): Promise<void> {
  const html = `
    <h2>Viaje Finalizado</h2>
    <p>El viaje <strong>${journeyId}</strong> ha sido completado y finalizado correctamente.</p>
  `
  await sendEmail({ to, subject: `[GBS GPS] Viaje Finalizado: ${journeyId}`, html })
}

export async function sendPendingEvidenceReminderEmail(to: string, count: number): Promise<void> {
  const html = `
    <h2>Recordatorio de Evidencias Pendientes</h2>
    <p>Tienes <strong>${count}</strong> viaje(s) pendiente(s) de evidencia de odómetro o con lecturas fuera de tolerancia.</p>
    <p>Por favor ingresa a <strong>/mis-viajes</strong> y adjunta la fotografía inicial y final de tu odómetro.</p>
  `
  await sendEmail({ to, subject: `[GBS GPS] Recordatorio: ${count} evidencia(s) pendiente(s)`, html })
}
