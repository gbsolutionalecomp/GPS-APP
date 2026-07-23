const dateTimeFormatter = new Intl.DateTimeFormat('es-MX', {
  timeZone: 'America/Mexico_City',
  dateStyle: 'medium',
  timeStyle: 'short',
})

const dayOfWeekFormatter = new Intl.DateTimeFormat('es-MX', {
  timeZone: 'America/Mexico_City',
  weekday: 'long',
})

const shortDateFormatter = new Intl.DateTimeFormat('es-MX', {
  timeZone: 'America/Mexico_City',
  day: 'numeric',
  month: 'short',
})

export function formatDateTime(value?: string): string {
  if (!value) return 'Pendiente'
  return dateTimeFormatter.format(new Date(value))
}

export function formatKm(value?: number | null): string {
  if (value === undefined || value === null) return 'Pendiente'
  return `${value.toLocaleString('es-MX', { maximumFractionDigits: 1 })} km`
}

export function formatDuration(startStr?: string, endStr?: string): string {
  if (!startStr || !endStr) return '—'
  const start = new Date(startStr).getTime()
  const end = new Date(endStr).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return '—'
  const totalMinutes = Math.round((end - start) / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes} min`
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'GB'
}

/**
 * Retorna la clave 'YYYY-MM' y la etiqueta del mes en español (ej. "Julio 2026")
 */
export function getMonthKeyAndLabel(dateStr?: string): { key: string; label: string } {
  if (!dateStr) return { key: 'sin-fecha', label: 'Sin Fecha' }
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return { key: 'sin-fecha', label: 'Sin Fecha' }
  const year = d.getFullYear()
  const monthNum = String(d.getMonth() + 1).padStart(2, '0')
  const key = `${year}-${monthNum}`
  const monthName = d.toLocaleString('es-MX', { month: 'long' })
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1)
  return { key, label: `${capitalizedMonth} ${year}` }
}

/**
 * Obtiene el número de semana ISO del año (1 a 53)
 */
export function getISOWeekNumber(dateStr?: string): number {
  if (!dateStr) return 0
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return 0
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

/**
 * Retorna la información de la carga semanal (Semana N + Día de subida/registro)
 * ej: { weekNumber: 27, weekLabel: "Semana 27", uploadLabel: "Subido: Miércoles 01 Jul" }
 */
export function getWeeklyUploadInfo(tripDateStr?: string, createdDateStr?: string): { weekNumber: number; weekLabel: string; uploadLabel: string } {
  const targetDateStr = createdDateStr || tripDateStr
  if (!targetDateStr) return { weekNumber: 0, weekLabel: 'Semana —', uploadLabel: 'Sin fecha' }
  const d = new Date(targetDateStr)
  if (Number.isNaN(d.getTime())) return { weekNumber: 0, weekLabel: 'Semana —', uploadLabel: 'Sin fecha' }
  
  const weekNumber = getISOWeekNumber(tripDateStr || targetDateStr)
  const dayName = dayOfWeekFormatter.format(d)
  const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1)
  const dateFormatted = shortDateFormatter.format(d)

  return {
    weekNumber,
    weekLabel: `Semana ${weekNumber}`,
    uploadLabel: `${capitalizedDay} ${dateFormatted}`,
  }
}
