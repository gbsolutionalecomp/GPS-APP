# GBS · Control de Viajes y GPS

Aplicación independiente para registrar recorridos de Locatelia, sus paradas y las evidencias de odómetro inicial/final. Está diseñada para una organización con proyectos, vehículos, administradores e ingenieros.

## Arranque local

1. Copia `.env.example` como `.env.local`.
2. Sin credenciales, conserva `APP_DATA_MODE=demo` para usar el escenario completo de demostración.
3. Ejecuta `pnpm dev` y abre `http://localhost:3000`.

Comandos de verificación: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` y `pnpm test:e2e`.

## Producción

1. Crea un proyecto Supabase nuevo para esta aplicación; no reutilices el de Gastos de Viaje.
2. Vincula el proyecto con Supabase CLI y aplica `supabase db push`. La migración está en `supabase/migrations/20260721000100_gps_foundation.sql`.
3. En Supabase Auth, crea el primer usuario y cambia su fila en `profiles` a `role = 'admin'` mediante SQL seguro. Los siguientes usuarios se crean como ingenieros.
4. Configura las variables de `.env.example` en Vercel y usa `APP_DATA_MODE=supabase`.
5. Despliega `locatelia-webhook`, `locatelia-sync` y `pending-evidence-reminder`; agrega sus secretos con `supabase secrets set` (incluye `RESEND_API_KEY`, `NOTIFICATIONS_FROM_EMAIL`, `REMINDER_CRON_SECRET`, `NEXT_PUBLIC_APP_URL`).
6. Programa `locatelia-sync` cada minuto sólo cuando Locatelia entregue una API compatible. Mientras tanto, deja `mode=import`: la carga CSV/TXT/XLSX seguirá operativa.
7. Programa `pending-evidence-reminder` semanalmente (por ejemplo, cada viernes) desde Supabase Scheduled Triggers, con el encabezado `x-cron-secret` igual a `REMINDER_CRON_SECRET`. Revisa todos los viajes finalizados y asignados; a cada ingeniero con viajes sin evidencia, con lectura inválida o con el odómetro fuera de tolerancia respecto al GPS le envía un correo con la lista y el enlace a `/mis-viajes`. Sin `RESEND_API_KEY`/`NOTIFICATIONS_FROM_EMAIL`, la función corre igual pero no envía correos.
8. Configura las mismas variables de correo (`RESEND_API_KEY`, `NOTIFICATIONS_FROM_EMAIL`) en Vercel: cuando un administrador asigna un viaje a un ingeniero (`/viajes/[id]`), la app le avisa por correo de inmediato además de listarlo en su bandeja `/mis-viajes`.

## Ciclo semanal de operación

1. **Administración** sube el export de la plataforma GPS en `Integración → Importación de respaldo` (normalmente cada viernes). Cada tramo `Fin Parada → Inicio Parada` se convierte en un viaje.
2. **Administración** asigna proyecto e ingeniero a los viajes nuevos en `/viajes`; el ingeniero recibe un correo de aviso (si el correo está configurado) y el viaje aparece en su bandeja `/mis-viajes`.
3. **Ingeniero** sube, por cada viaje, dos fotografías del odómetro (inicial y final) con su lectura en kilómetros.
4. La app calcula la distancia por odómetro (final menos inicial) y la compara contra la distancia reportada por el GPS. Si la diferencia excede `ODOMETER_GPS_TOLERANCE_KM` (3 km, definido en `src/domain/journeys.ts`), el viaje se guarda pero queda marcado **"Odómetro no coincide con GPS"** — no bloquea la carga, pero mantiene el viaje como pendiente hasta corregirse.
5. `pending-evidence-reminder`, corrida semanalmente, vuelve a avisar por correo a cada ingeniero que todavía tenga viajes sin evidencia o con la lectura fuera de tolerancia.

## Bandeja de archivos de la plataforma GPS

Los reportes que exporta la plataforma (por ejemplo "Históricos GPS" por vehículo y periodo) se archivan localmente en `ENTRADAS/historicos-gps/<PLACA>/` antes o después de subirlos desde `Integración → Importación de respaldo`. Ver `ENTRADAS/historicos-gps/README.md` para la convención de nombres y el flujo completo. Esa carpeta no se versiona (contiene ubicaciones reales de la flotilla); sólo su `README.md` queda en el repositorio.

Las fotos se guardan en el bucket privado `odometer-evidence`. Las reglas RLS hacen que el ingeniero vea únicamente sus viajes y evidencias; el administrador ve y administra toda la operación. No hay acciones de borrado desde la interfaz.

## Contrato que se debe pedir a Locatelia

Solicitar: URL y ambiente de pruebas, autenticación de sólo lectura, catálogo de vehículos/dispositivos, recorridos, paradas, paginación, límites, zona horaria, identificador externo estable, correcciones y webhook firmado. La adaptación de campos está centralizada en `src/integrations/locatelia/` y `supabase/functions/_shared/locatelia.ts`.

Si el proveedor no entrega API/webhook, exporta CSV, TXT o XLSX con al menos placa o ID de dispositivo e inicio. La app deduplica por identificador externo; cuando no existe, usa una huella de vehículo, inicio, fin y distancia.

## Arquitectura

```text
Locatelia API / webhook / archivo
              ↓
  Adaptador + deduplicación + vínculo con viaje programado
              ↓
 Supabase PostgreSQL + RLS + Storage privado + Realtime
              ↓
 Next.js: administrador / ingeniero / PDF / Excel
```

Todos los timestamps se guardan en UTC y los reportes se agrupan con `America/Mexico_City`.
