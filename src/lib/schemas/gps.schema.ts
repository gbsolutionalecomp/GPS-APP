import { z } from 'zod'

export const GPSTelemetryPointSchema = z.object({
  vehiculo_id: z.string().min(1, 'El ID de vehículo es requerido'),
  latitud: z.number().min(-90).max(90, 'Latitud inválida'),
  longitud: z.number().min(-180).max(180, 'Longitud inválida'),
  velocidad_kmh: z.number().min(0, 'La velocidad no puede ser negativa'),
  rumbo: z.number().min(0).max(360).optional(),
  timestamp: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Timestamp ISO 8601 inválido',
  }),
})

export const GPSTrackingBatchSchema = z.object({
  viaje_id: z.string().min(1, 'El ID de viaje es requerido'),
  puntos: z.array(GPSTelemetryPointSchema).min(1, 'Debe incluir al menos un punto GPS'),
})

export type GPSTelemetryPoint = z.infer<typeof GPSTelemetryPointSchema>
export type GPSTrackingBatch = z.infer<typeof GPSTrackingBatchSchema>
