# Guía de Despliegue - GPS-APP

Instrucciones para desplegar la aplicación en Vercel y Supabase.

## 🌐 Despliegue en Vercel

### Secretos en GitHub Actions
Para habilitar el despliegue automático mediante el workflow `.github/workflows/deploy.yml`:
- `VERCEL_TOKEN`: Token personal de API de Vercel.
- `VERCEL_ORG_ID`: ID de la organización en Vercel.
- `VERCEL_PROJECT_ID`: ID del proyecto en Vercel.

### Variables de Entorno en Vercel
Configurar en Vercel Dashboard:
- `APP_DATA_MODE`: `supabase` (o `demo` para pruebas)
- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Clave pública
- `SUPABASE_SERVICE_ROLE_KEY`: Clave administrativa de servicio
- `RESEND_API_KEY`: Clave de API de Resend (opcional para notificaciones)
- `NOTIFICATIONS_FROM_EMAIL`: Correo remitente (ej. `alertas@gbsolution.com`)
- `LOCATELIA_WEBHOOK_SECRET`: Clave secreta para firmar webhooks de Locatelia

---

## 🗄️ Configuración de Supabase
1. Ejecutar las migraciones SQL localizadas en `supabase/migrations/`.
2. Verificar reglas RLS y permisos del bucket `odometer-evidence`.
