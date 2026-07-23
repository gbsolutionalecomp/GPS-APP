import { z } from 'zod'

export const ParadaSchema = z.object({
  viaje_id: z.string().min(1, 'El ID de viaje es requerido'),
  inicio: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Inicio inválido' }),
  fin: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Fin inválido' }),
  duracion_minutos: z.number().min(0, 'La duración no puede ser negativa'),
  latitud: z.number().min(-90).max(90),
  longitud: z.number().min(-180).max(180),
  direccion: z.string().optional(),
  justificacion: z.string().optional(),
})

export const JustificarParadaSchema = z.object({
  parada_id: z.string().min(1, 'El ID de parada es requerido'),
  justificacion: z.string().min(5, 'La justificación debe tener al menos 5 caracteres'),
})

export type ParadaInput = z.infer<typeof ParadaSchema>
export type JustificarParadaInput = z.infer<typeof JustificarParadaSchema>
