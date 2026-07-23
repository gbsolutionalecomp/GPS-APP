# GBS · Control de Viajes y GPS (gbs-control-viajes-gps)

Aplicación institucional independiente para registrar recorridos de Locatelia, sus paradas y las evidencias de odómetro inicial/final. Diseñada para una gestión rigurosa con proyectos, vehículos, administradores e ingenieros.

- **Deploy en Producción:** [https://gps-app-ivory.vercel.app](https://gps-app-ivory.vercel.app)
- **Repositorio GitHub:** [https://github.com/gbsolutionalecomp/GPS-APP](https://github.com/gbsolutionalecomp/GPS-APP)

---

## 🛠️ Stack Tecnológico
- **Core:** Next.js 16 (App Router) + React 19 + TypeScript (Strict Mode)
- **Base de Datos & Auth:** Supabase PostgreSQL + RLS + Private Storage
- **Testing:** Vitest + React Testing Library + Playwright (E2E)
- **Validación:** Zod
- **Reportes:** `pdf-lib` (PDF), `exceljs` (Excel), `papaparse` (CSV)
- **Notificaciones:** Resend API
- **Package Manager:** `pnpm` (10.15.0)

---

## 🚀 Arranque Local

1. Copia `.env.example` como `.env.local`.
2. Sin credenciales, conserva `APP_DATA_MODE=demo` para usar el escenario completo de demostración.
3. Ejecuta `pnpm dev` y abre `http://localhost:3000`.

### Comandos de Verificación Completa
```bash
pnpm check
```
*(Ejecuta linter, verificación de tipos TypeScript, tests unitarios con Vitest y build de producción)*

```bash
pnpm test:e2e
```
*(Ejecuta el conjunto completo de pruebas E2E con Playwright)*

---

## 📚 Documentación Adicional

- 📘 [DEVELOPMENT.md](DEVELOPMENT.md) — Guía de ambiente local y estructura de código.
- 🧪 [TESTING.md](TESTING.md) — Guía de pruebas unitarias (Vitest) y E2E (Playwright).
- 🔌 [API.md](API.md) — Especificación de endpoints y webhooks (Locatelia, Health, Export).
- 🚀 [DEPLOYMENT.md](DEPLOYMENT.md) — Configuración de despliegue en Vercel y Supabase.
- ✨ [FEATURES.md](FEATURES.md) — Descripción de funcionalidades y reglas de negocio.
