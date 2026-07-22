# Plan de producción · GBS Control de Viajes y GPS
**Estado: Fases 1-3 EJECUTADAS y verificadas (22/07/2026). Fase 4 (despliegue) pendiente de credenciales del usuario.**

Objetivo: app más sencilla de entender, autenticación impecable, base de datos preparada para volumen de fotos, desplegada en Vercel + Supabase, con interfaz sobria corporativa (no genérica).

---

## Fase 1 · Simplificar la interfaz (sin tocar la lógica de fondo)

Hoy hay 7 secciones (Panel, Viajes, Programación, Reportes, Catálogos, Integración, Mis viajes) con jerga técnica ("Locatelia", "conector", "webhook", "modo api"). Cambios:

1. **Ingeniero ve una sola pantalla**: "Mis viajes" — lista de pendientes arriba (con botón de cámara grande), completados abajo. Nada más en su menú.
2. **Admin ve 4 secciones**:
   - **Viajes** (absorbe Panel operativo y Programación: crear viaje programado se hace desde un botón aquí)
   - **Subir recorridos** (antes "Integración/Locatelia"): flujo guiado de 3 pasos — 1) subir Excel, 2) revisar viajes detectados, 3) asignar ingeniero y proyecto en la misma pantalla. Todo el contenido técnico del conector/API se mueve a una sección colapsada "Avanzado".
   - **Reportes** (igual, PDF/Excel mensual)
   - **Equipo y unidades** (antes "Catálogos": ingenieros, vehículos, proyectos)
3. **Lenguaje**: quitar tecnicismos de la UI. "Locatelia" → "plataforma GPS", "evidencia de odómetro" → "fotos del odómetro", "sincronización" → sólo visible en Avanzado.
4. **Rediseño visual sobrio**: tipografía sistema, paleta corporativa (verde GBS existente pero moderada), sin tarjetas métricas decorativas de más, densidad tipo herramienta interna. Nada que "parezca IA".

## Fase 2 · Autenticación perfecta (huecos reales encontrados)

1. **BUG crítico**: `inviteUserByEmail` envía un enlace tipo `token_hash` (verifyOtp type=invite), pero `/auth/confirm` sólo procesa `?code=` (PKCE). El ingeniero invitado no puede completar su alta. Corregir `/auth/confirm` para manejar ambos flujos, con manejo de errores visible (hoy los ignora en silencio).
2. **Nueva página "Establecer contraseña"** (`/auth/contrasena`): a donde aterriza el invitado y donde define su contraseña antes de entrar.
3. **"Olvidé mi contraseña"**: enlace en el login → `resetPasswordForEmail` → misma página de establecer contraseña.
4. **Cerrar sesión real** verificado (signOut + limpiar cookies + redirect a /login).
5. Middleware de protección por rol ya existe y está bien — se conserva y se prueba.
6. **Pruebas E2E de Playwright** del ciclo completo: invitar → establecer contraseña → login → ver sólo mis viajes → logout.

## Fase 3 · Base de datos y fotos a escala

1. **Compresión en el cliente antes de subir**: canvas → JPEG/WebP máx ~1600px (~200–400 KB por foto, vs 10 MB actuales). Con 2 fotos × viaje × varios ingenieros × semanas, esto es la diferencia entre caber en el plan de Supabase o no. Se conserva validación de 10 MB como tope duro del lado servidor y bucket.
2. **Servir fotos con URLs firmadas** (createSignedUrl, 60 min) en vez del route handler actual que descarga cada foto a través del servidor Next (`/api/evidencias/[id]/foto`) — las fotos salen directo del CDN de Storage; menos costo y latencia.
3. **Migración v2** (`20260722xxxxxx_photo_scale.sql`): columnas de metadatos en `odometer_evidence` (bytes, mime, ancho/alto, sha256 para detectar duplicados), índice por `uploaded_at`. Las políticas RLS de Storage ya existen en la migración v1 y están correctas.
4. Esquema, RLS y triggers de auditoría existentes se conservan tal cual (ya están bien diseñados).

## Fase 4 · Despliegue Vercel + Supabase

1. **Git**: `GPS PROYECTOS` no es hoy un repositorio git válido. Inicializar repo, primer commit, subir a GitHub del usuario (privado).
2. **Supabase**: crear proyecto nuevo (requiere cuenta del usuario), `supabase link` + `db push` (aplica migraciones v1+v2 con bucket y políticas), crear primer usuario admin, configurar remitente de correo (SMTP de Supabase o Resend) para que invitaciones y restablecimientos lleguen de verdad.
3. **Vercel**: importar el repo, variables de entorno (`APP_DATA_MODE=supabase`, claves Supabase, correo), deploy. El guard de `next.config.mjs` ya valida que no se despliegue a producción sin las variables.
4. **Funciones**: desplegar `pending-evidence-reminder` y programarla (viernes); `locatelia-sync`/webhook quedan apagadas hasta que la plataforma GPS entregue API.
5. **Lo que necesito del usuario en esta fase**: acceso/cuenta de GitHub, Vercel y Supabase (y Resend si se quiere correo con dominio propio). Sin eso puedo dejar todo listo hasta el paso exacto y darte los comandos.

## Fase 5 · Verificación final

- `pnpm check` completo (lint + typecheck + test + build) y E2E.
- Prueba manual del ciclo semanal completo en el deploy real: subir el Excel de RK17022 → asignar → subir 2 fotos desde un teléfono → validación de tolerancia ±3 km → reporte mensual.

## Orden y alcance

Fases 1–3 son código local verificable de inmediato. Fase 4 requiere cuentas del usuario. Estimación de ejecución: Fases 1–3 en esta sesión de trabajo; Fase 4 en cuanto haya credenciales.
