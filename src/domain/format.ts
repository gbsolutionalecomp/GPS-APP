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

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'GB'
}
