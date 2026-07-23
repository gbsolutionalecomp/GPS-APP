import { z } from 'zod'

export const ViajeStatusSchema = z.enum([
  'programado',
  'en_curso',
  'finalizado',
  'sin_evidencia',
  'evidencia_invalida',
  'completado',
])

export const ScheduleViajeSchema = z.object({
  vehiculo_id: z.string().min(1, 'El vehículo es obligatorio'),
  proyecto_id: z.string().min(1, 'El proyecto es obligatorio'),
  ingeniero_id: z.string().min(1, 'El ingeniero asignado es obligatorio'),
  origen: z.string().min(2, 'El origen debe tener al menos 2 caracteres'),
  destino: z.string().min(2, 'El destino debe tener al menos 2 caracteres'),
  fecha_programada: z.string().min(1, 'La fecha programada es obligatoria'),
  notas: z.string().optional(),
})

export const AssignViajeSchema = z.object({
  proyecto_id: z.string().min(1, 'El proyecto es obligatorio'),
  ingeniero_id: z.string().min(1, 'El ingeniero es obligatorio'),
})

export const UpdateViajeStatusSchema = z.object({
  estado: ViajeStatusSchema,
  observaciones: z.string().optional(),
})

export type ViajeStatus = z.infer<typeof ViajeStatusSchema>
export type ScheduleViajeInput = z.infer<typeof ScheduleViajeSchema>
export type AssignViajeInput = z.infer<typeof AssignViajeSchema>
