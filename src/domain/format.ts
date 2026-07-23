const dateTimeFormatter = new Intl.DateTimeFormat('es-MX', {
  timeZone: 'America/Mexico_City',
  dateStyle: 'medium',
  timeStyle: 'short',
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
