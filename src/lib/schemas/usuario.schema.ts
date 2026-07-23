import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('Formato de correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const SetPasswordSchema = z
  .object({
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string().min(8, 'La confirmación es requerida'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export const UserProfileSchema = z.object({
  id: z.string().min(1),
  full_name: z.string().min(2, 'El nombre completo debe tener al menos 2 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  role: z.enum(['admin', 'ingeniero']),
})

export type LoginInput = z.infer<typeof LoginSchema>
export type SetPasswordInput = z.infer<typeof SetPasswordSchema>
export type UserProfile = z.infer<typeof UserProfileSchema>
