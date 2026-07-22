# Historial de Cambios - GPS PROYECTOS
**Sincronización permanente entre Claude Code y CODEX**

## Instrucciones de uso
- Cada cambio se registra con: `[AUTOR] [FECHA - HORA] - Descripción del cambio`
- AUTOR: `Claude Code` o `CODEX`
- FECHA: DD/MM/YYYY
- HORA: HH:MM (24h)
- Este archivo es el registro compartido y permanente

---

## Registro de cambios

### 2026-07-22

**[Claude Code] [22/07/2026 - 09:35] - Ejecución de Fases 1-3 del plan de producción (ver `PLAN_PRODUCCION.md`)**
- Contexto: el usuario pidió simplificar la app, arreglar autenticación "para que funcione perfectamente", preparar la base de datos para el volumen de fotos, y desplegar. Se entregó primero un plan por escrito (`_MEMORIA_CLAUDE_CODEX/PLAN_PRODUCCION.md`) y el usuario lo aprobó explícitamente vía AskUserQuestion antes de tocar código. Fase 4 (Vercel/Supabase reales) sigue pendiente porque requiere las cuentas del usuario.

**Auth (bug real encontrado y corregido):**
- `src/app/auth/confirm/route.ts` sólo procesaba `?code=` (PKCE). Los enlaces que genera `inviteUserByEmail`/`resetPasswordForEmail` usan `token_hash`+`type` (verifyOtp), así que **ningún ingeniero invitado podía completar su alta** antes de este fix. Ahora maneja ambos flujos y redirige con `?error=confirm_failed` a `/login` si el enlace falla, en vez de fallar en silencio.
- Nueva pantalla `/auth/contrasena` (`src/app/auth/contrasena/page.tsx` + `src/components/set-password-form.tsx`) para que el invitado (o quien pidió recuperar) defina su contraseña. Verificada en el navegador: sin sesión válida muestra "Este enlace ya no es válido..." en vez de tronar (hubo que envolver en try/catch porque `getSupabaseBrowserClient()` lanza si Supabase no está configurado — se disparaba un error boundary real en modo demo).
- `src/components/login-form.tsx`: agregado "¿Olvidaste tu contraseña?" (llama a `resetPasswordForEmail` con `redirectTo` a `/auth/confirm?next=/auth/contrasena`) y mensaje visible cuando `?error=confirm_failed`.
- `src/lib/supabase/proxy.ts`: `/auth/contrasena` agregado a `publicPaths`.
- **Pendiente de verificar con Supabase real (Fase 4)**: el flujo de invitación/recuperación no se pudo probar de punta a punta porque este entorno está en `APP_DATA_MODE=demo` sin proyecto Supabase. Cuando exista el proyecto real, probar: invitar ingeniero → recibir correo → `/auth/confirm?token_hash=...&type=invite` → `/auth/contrasena` → login. Revisar también que la plantilla de correo de Supabase use `{{ .ConfirmationURL }}` (o el patrón `token_hash`/`type`/`next` equivalente) — eso es configuración del proyecto Supabase, no de este repo.

**Fotos a escala:**
- `src/lib/media/compress-image.ts`: comprime cada foto a JPEG ~1600px antes de subir (canvas + `toBlob`), usado en `src/components/evidence-panel.tsx`. Si falla, sube el original sin romper el flujo.
- `src/lib/media/image-metadata.ts`: calcula tamaño, tipo, ancho/alto y sha256 (huella antiduplicados) de cada foto ya comprimida.
- `src/components/app-provider.tsx` (`saveEvidence`): envía esos metadatos al insertar en `odometer_evidence`.
- `supabase/migrations/20260722000100_evidence_metadata.sql`: agrega columnas `byte_size, mime_type, width_px, height_px, sha256` a `odometer_evidence` (todas nullable, `add column if not exists`, no rompe datos existentes) + índices por `uploaded_at` y `sha256`.
- `src/domain/types.ts`: `OdometerEvidence` con los nuevos campos opcionales.
- `src/data/server-snapshot.ts`: las fotos ahora se sirven con **URLs firmadas directo de Supabase Storage** (`createSignedUrls`, batch, 1h de vigencia) en vez de pasar todas por el proxy `/api/evidencias/[id]/foto`. Ese endpoint se dejó intacto como respaldo (si no hay URL firmada disponible, cae de vuelta a él) — no se eliminó nada.
- **Pendiente de verificar con Supabase real**: `createSignedUrls` requiere que las políticas RLS de `storage.objects` (ya existían en la migración v1, no se tocaron) sigan permitiendo la lectura para el usuario autenticado; probar con fotos reales una vez haya proyecto Supabase.

**Simplificación de interfaz:**
- Navegación del admin: de 7 a 5 enlaces. Se fusionó **Programación** dentro de **Viajes** (botón "Programar viaje" que abre un panel plegable con el mismo formulario — `src/components/schedule-journey-form.tsx`); `/programacion` ahora es un redirect a `/viajes?programar=1` (se conserva por compatibilidad, no se borró). "Locatelia" → **"Subir recorridos"**; "Catálogos" → **"Equipo y unidades"**.
- El ingeniero ahora sólo ve **"Mis viajes"** en su navegación (antes también veía "Panel operativo"). `src/app/page.tsx` redirige automáticamente a `/mis-viajes` si el usuario autenticado es ingeniero.
- `/integracion` (Subir recorridos): el formulario de carga quedó arriba y es lo único visible por default; todo lo técnico (estado del conector, auditoría de cargas, checklist para el proveedor) se movió a un `<details>` colapsado "Avanzado: conexión automática y auditoría" (`.disclosure` en `globals.css`).
- Se quitó "Locatelia" del texto visible en toda la app (quedó sólo en nombres internos de archivos/rutas: `locatelia-file.ts`, `/api/importaciones/locatelia`, etc. — eso es intencional, son identificadores técnicos, no texto que vea el usuario). "Evidencia" → "foto(s)" en los textos de cara al usuario.
- Verificado en el navegador (modo demo): nav de 5 enlaces para admin, redirect automático de ingeniero a Mis viajes con nav de 1 solo enlace, panel "Programar viaje" abre correctamente, "Subir recorridos" con Avanzado colapsado.

**Bug de entorno encontrado y corregido (no relacionado a este plan pero bloqueaba la verificación):** el servidor de desarrollo con Turbopack quedó en un estado corrupto (`TypeError: components.ComponentMod.handler is not a function` en `/integracion`) después de varias ediciones de archivo en caliente. Se resolvió borrando `.next/` y reiniciando — si vuelve a pasar, ese es el fix (no es un bug de código).

**Verificación final:** `pnpm lint`, `pnpm typecheck`, `pnpm test` (13/13) y `pnpm build` pasan limpios después de todos los cambios de esta sesión.

**Siguiente paso (Fase 4, requiere al usuario):** cuentas de GitHub/Vercel/Supabase para desplegar de verdad y probar el ciclo de invitación/recuperación de contraseña con correo real.

### 2026-07-21

**[Claude Code] [21/07/2026 - 20:10] - Inicialización de estructura de memoria permanente**
- Creada carpeta `_MEMORIA_CLAUDE_CODEX/` para sincronización con CODEX
- Inicializado archivo `HISTORIAL_CAMBIOS.md` con protocolo de registro
- Contexto: Proyecto GPS PROYECTOS (sistema de tracking de viajes con Next.js)
- Próximo paso: Validar estado actual del código y dependencias

**[Claude Code] [21/07/2026 - 22:30] - Estructura de carga de archivos de la plataforma GPS + endurecimiento del importador**
- Contexto: el usuario adjuntó un export real de la plataforma GPS ("secovi sapi de cv - RK17022 - Históricos GPS..."). Se verificó que el pipeline de importación (`src/features/imports/locatelia-file.ts` → `src/integrations/locatelia/adapter.ts` → `POST /api/importaciones/locatelia` → UI `src/components/import-center.tsx` en `/integracion`) **ya existía y ya estaba diseñado exactamente para este formato** (hoja `Info` + hoja `Históricos GPS` con columnas Fecha/Hora/Estado/Población/Zona/Provincia/Alarma/Anotaciones, colapsando pares `Fin Parada → Inicio Parada` en viajes). No se rediseñó nada de esa lógica.
- Creada `ENTRADAS/historicos-gps/` dentro de `GPS PROYECTOS` (carpeta de archivo local, NO es el mecanismo de carga — la carga real sigue siendo por la app en `/integracion`). Incluye `README.md` con convención de nombres (`YYYY-MM-DD__empresa__PLACA__historicos-gps__vNN.xlsx`), organizado por subcarpeta de placa, y el flujo paso a paso.
- Copiado el archivo real del usuario como ejemplo en `ENTRADAS/historicos-gps/RK17022/2026-07-21__secovi-sapi-de-cv__RK17022__historicos-gps__v01.xlsx`.
- Añadida esa misma carpeta y sus contenidos a `.gitignore` (excepto el README) porque contiene ubicaciones reales de la flotilla y no debe versionarse.
- Añadido el archivo real como fixture de prueba en `src/features/imports/fixtures/secovi-rk17022-historicos-gps.xlsx` y una prueba de regresión nueva en `src/features/imports/locatelia-file.test.ts` ("procesa un archivo real exportado por la plataforma sin errores") que corre el parser contra el archivo real (no sólo el fixture sintético que ya existía) y valida placa, fechas ISO y orden inicio/fin.
- Añadido en `README.md` de `GPS PROYECTOS` un apartado corto que enlaza a `ENTRADAS/historicos-gps/README.md`.
- **Pendiente / no verificado en esta sesión**: no había Node/pnpm disponible en el entorno para ejecutar `pnpm test`. CODEX o el usuario deben correr `pnpm test` (o al menos `pnpm vitest run src/features/imports/locatelia-file.test.ts`) para confirmar que la prueba nueva pasa antes de dar esto por cerrado.
- Próximo paso sugerido: si la plataforma llega a exportar este mismo reporte en CSV/TXT (no sólo XLSX), hoy esos formatos sólo soportan el esquema "recorridos resumidos" (placa/inicio/fin/km), no el log crudo de eventos — habría que extender `parseLocateliaFile` para detectar el mismo layout también en CSV/TXT si el usuario lo necesita.

**[Claude Code] [21/07/2026 - 23:15] - Validación GPS↔odómetro con tolerancia + notificaciones por correo (asignación y recordatorio semanal)**
- Contexto: el usuario describió el ciclo que necesita — admin sube el export semanal, la app desglosa los viajes, el ingeniero sube 2 fotos (odómetro inicial/final) por viaje y el valor del odómetro debe coincidir con la distancia del GPS. Se confirmó con el usuario (AskUserQuestion): (1) si no coincide, el viaje se **permite guardar pero queda marcado "por corregir"** (no se bloquea el guardado), (2) tolerancia de **3 km**, (3) sí se debe **avisar por correo** al ingeniero, no sólo listarlo en su bandeja.
- `src/domain/journeys.ts`: nueva constante `ODOMETER_GPS_TOLERANCE_KM = 3` y función `odometerMatchesGps(odometerKm, gpsDistanceKm)`. `getJourneyState` ahora, además del caso "final < inicial", marca un viaje completo con evidencia como **"Odómetro no coincide con GPS"** (`workflow: 'pending_evidence'`, tone `danger`) cuando `|odómetro − GPS| > 3 km`. Esto lo hace aparecer automáticamente en `/mis-viajes` (filtro "Por completar"), en `/viajes`, y en los reportes PDF/Excel (ya usaban `state.workflow !== 'complete'` genéricamente, no se tocaron).
- `src/components/journey-detail.tsx`: la tarjeta de "Diferencia" ahora usa `ODOMETER_GPS_TOLERANCE_KM` en vez de un `3` embebido, y muestra la tolerancia en el subtítulo.
- `src/domain/journeys.test.ts`: pruebas nuevas para el caso dentro/fuera de tolerancia y para `odometerMatchesGps` (permisivo cuando falta algún dato). Verificado a mano contra `demoSnapshot`: `journey-complete` tiene GPS 86.4 km y odómetro 88 km (diferencia 1.6 km) — sigue "completo" tras el cambio.
- Correo — **antes no existía ninguna integración de correo en el proyecto**, se agregó desde cero vía Resend (API HTTP simple, sin SMTP/nodemailer):
  - `src/lib/notifications/email.ts` (Node/Next) y `supabase/functions/_shared/email.ts` (Deno/edge function): mismo contrato `sendEmail({ to, subject, html })`. Sin `RESEND_API_KEY`/`NOTIFICATIONS_FROM_EMAIL` configuradas, no hacen nada (no rompe demo/local).
  - Nueva ruta `POST /api/viajes/[id]/asignacion` (admin-only, `authorizeAdmin`): hace el `update` de `project_id`/`engineer_id` en `journeys` (antes esto lo hacía `assignJourney` directo desde el navegador con el cliente de Supabase) y, si el ingeniero tiene correo, le envía aviso de "nuevo viaje asignado" con link a `/mis-viajes`. El envío de correo es best-effort (no revierte la asignación si falla).
  - `src/components/app-provider.tsx`: `assignJourney` en modo `supabase` ahora llama a esa ruta en vez de actualizar la tabla directamente desde el cliente (necesario porque el envío de correo requiere contexto de servidor). El modo `demo` no cambió.
  - Nueva función programada `supabase/functions/pending-evidence-reminder/index.ts`: pensada para correr semanalmente (viernes) vía Supabase Scheduled Triggers, protegida con header `x-cron-secret` == `REMINDER_CRON_SECRET`. Recorre viajes finalizados y asignados, aplica la misma regla de pendiente/mismatch (duplicada intencionalmente en Deno porque no se puede importar `src/domain` con alias `@/` desde una edge function; **si se cambia la tolerancia en `src/domain/journeys.ts`, hay que replicarlo aquí**, está anotado en un comentario), agrupa por ingeniero y le manda un correo con la lista de viajes pendientes.
  - `.env.example`: agregadas `RESEND_API_KEY`, `NOTIFICATIONS_FROM_EMAIL`, `REMINDER_CRON_SECRET`.
  - `README.md`: nueva sección "Ciclo semanal de operación" documentando el flujo completo extremo a extremo, y pasos 7-8 en "Producción" para desplegar/programar `pending-evidence-reminder` y configurar las variables de correo en Vercel.
- **Pendiente / no verificado en esta sesión**: sin Node/pnpm en este entorno no se pudo correr `pnpm test` ni `pnpm typecheck`. CODEX o el usuario deben correrlos antes de dar esto por cerrado — especialmente revisar tipos en `src/app/api/viajes/[id]/asignacion/route.ts` (accesos a `.data?.campo` sobre resultados de Supabase sin tipar, como ya se hace en el resto del proyecto, pero conviene confirmar que compila).
- Próximo paso sugerido: si se quiere, se puede agregar una plantilla de correo con mejor diseño (hoy es HTML mínimo inline) o mover el umbral de tolerancia a una tabla de configuración editable desde la UI en vez de una constante en código.

**[Claude Code] [21/07/2026 - 23:58] - Verificación real (Node sí estaba disponible, sólo faltaba en el PATH de la sesión anterior)**
- Se encontró Node 24.18.0 y pnpm 11.15.1 ya instalados en `C:\Program Files\nodejs` y `%AppData%\Roaming\npm` (no estaban en el PATH de la sesión de terminal). Con el PATH corregido se pudo correr todo lo que había quedado pendiente de verificar:
  - `pnpm test` → falló 1 de 13 pruebas: `loadFixtureFile` en `src/features/imports/locatelia-file.test.ts` resolvía la ruta del fixture con `fileURLToPath(new URL(..., import.meta.url))`, y en este proyecto (ruta con espacios, Vitest 4 + Turbopack) esa resolución rompía a `C:\src\...` en vez de la ruta real. **Corregido** usando `path.join(process.cwd(), 'src/features/imports/fixtures', name)`. Tras el fix: 13/13 pruebas pasan.
  - `pnpm typecheck` → 8 errores TS2538 preexistentes en `src/features/imports/locatelia-file.ts` (líneas 56-68, función `parseHistoryWorkbook`), de **antes** de esta sesión: se indexaba `record[headers[N]]` sin garantizar que `headers[N]` no fuera `undefined`. **Corregido** con `headers[N] ?? ''` en cada acceso. `pnpm typecheck` queda limpio.
  - `pnpm lint` → limpio, sin cambios necesarios.
  - `pnpm build` → build de producción exitoso; `/api/viajes/[id]/asignacion` aparece listado como ruta dinámica junto con el resto.
  - Se levantó `pnpm dev` y se recorrió la app en el navegador (modo demo, rol Administrador): `/integracion` (Import Center visible y funcional), `/viajes` (tabla con los 5 viajes demo) y el detalle de `journey-complete` — confirmado visualmente que la tarjeta "Diferencia" ahora dice "tolerancia ±3 km" y el viaje con GPS 86.4 km / odómetro 88 km (diferencia 1.6 km) se muestra como **Completo**, tal como se diseñó.
  - Ruido no relacionado, no corregido: en consola del navegador aparecen errores repetidos `eval() is not supported...` — causados por el header CSP de `next.config.mjs` (`script-src 'self' 'unsafe-inline'`, sin `unsafe-eval`) chocando con el modo desarrollo de React/Turbopack. Es preexistente (no lo tocamos), sólo ocurre en `pnpm dev`, y React mismo aclara que nunca usa `eval()` en producción — no se considera bloqueante, pero queda anotado por si en algún momento se quiere silenciar el overlay de Next en dev.
- Estado final: `pnpm test`, `pnpm typecheck`, `pnpm lint` y `pnpm build` pasan limpios. Ya no queda pendiente de verificación de esta sesión.

**[Claude Code] [22/07/2026 - 00:20] - `next.config.mjs`: anclar `turbopack.root` (cambio real al proyecto, no sólo de tooling)**
- Contexto: al intentar levantar el servidor de desarrollo mediante el mecanismo estándar de previsualización (que invoca el proceso desde fuera de `GPS PROYECTOS`, con rutas 8.3 sin espacios para node.exe), Turbopack fallaba con "Next.js inferred your workspace root, but it may not be correct... files outside of the project directory will not be compiled." — infería mal la raíz del workspace y por seguridad rechazaba compilar `next/package.json` desde `node_modules` (probablemente por el symlink real de pnpm resolviendo a la ruta larga con espacios mientras la raíz inferida usaba una ruta corta 8.3).
- Fix: en `next.config.mjs` se agregó `turbopack: { root: fileURLToPath(new URL('.', import.meta.url)) }`, que ancla explícitamente la raíz del workspace a la carpeta donde vive el propio `next.config.mjs` (`GPS PROYECTOS`), sin importar desde dónde ni con qué cwd se invoque `next dev`/`next build`.
- Es un cambio menor pero real al proyecto (no a config local de este entorno). Verificado con `pnpm build` (ya se había corrido limpio en el bloque anterior, antes de este cambio) — pendiente: re-correr `pnpm build`/`pnpm test` una vez más tras este cambio puntual si CODEX quiere doble confirmación, aunque el cambio sólo afecta la inferencia de raíz de Turbopack, no lógica de la app.
- No relacionado con la app en sí: se creó `.claude/launch.json` en la raíz del repositorio (`MAPEO DE PROCESOS GBS SOLUTIONS/.claude/launch.json`, fuera de `GPS PROYECTOS`) para que el mecanismo de previsualización de Claude Code pueda levantar `next dev` apuntando a `GPS PROYECTOS`. Es tooling de este asistente, no parte del producto.

