# Despliegue independiente GBS

## Variables de Vercel

| Variable | Uso |
| --- | --- |
| `APP_DATA_MODE` | `supabase` en producción; `demo` sólo para demostración local. |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto nuevo de Supabase. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave pública/publishable. |
| `SUPABASE_SERVICE_ROLE_KEY` | Sólo servidor: exportaciones privadas e invitaciones. Nunca usar `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_APP_URL` | URL pública final de Vercel. |

## Secrets de Edge Functions

| Secret | Uso |
| --- | --- |
| `LOCATELIA_WEBHOOK_SECRET` | Valida `x-locatelia-secret`. |
| `LOCATELIA_CRON_SECRET` | Valida las invocaciones programadas. |
| `LOCATELIA_API_URL` | Endpoint de recorridos oficial. |
| `LOCATELIA_API_TOKEN` | Token de sólo lectura proporcionado por Locatelia. |

Para el Cron, configura una invocación HTTP por minuto a `locatelia-sync` incluyendo `x-cron-secret`. Confirma primero los límites de Locatelia; si el proveedor exige un intervalo mayor, cambia la programación y `poll_interval_minutes` para que el panel lo comunique.

## Piloto de aceptación

Crear un proyecto, vehículo, administrador e ingeniero. Ejecutar un viaje programado y uno importado/no previsto. Comprobar asignación automática sólo con una coincidencia de ventana, carga de dos lecturas, restricción de odómetro final, vista de tramos y exportaciones PDF/Excel. Verificar además con la cuenta del ingeniero que no sea posible leer otro recorrido ni su fotografía privada.
