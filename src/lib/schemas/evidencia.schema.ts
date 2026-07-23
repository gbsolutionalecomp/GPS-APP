import { z } from 'zod'

export const EvidenciaOdometroSchema = z
  .object({
    viaje_id: z.string().min(1, 'El ID de viaje es requerido'),
    odometro_inicial_km: z.number().min(0, 'El odómetro inicial debe ser >= 0'),
    odometro_final_km: z.number().min(0, 'El odómetro final debe ser >= 0'),
    foto_inicial_url: z.string().min(1, 'La foto del odómetro inicial es requerida'),
    foto_final_url: z.string().min(1, 'La foto del odómetro final es requerida'),
    observaciones: z.string().optional(),
  })
  .refine((data) => data.odometro_final_km >= data.odometro_inicial_km, {
    message: 'El odómetro final no puede ser menor al inicial',
    path: ['odometro_final_km'],
  })

export type EvidenciaOdometroInput = z.infer<typeof EvidenciaOdometroSchema>
