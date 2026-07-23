# Guía de Desarrollo - GPS-APP (gbs-control-viajes-gps)

Esta guía documenta la estructura del proyecto, convenciones de código y el flujo de desarrollo local.

## 🚀 Requisitos previos
- **Node.js**: `24.x`
- **Package Manager**: `pnpm` (`10.15.0`)
- **Git**

## 🛠️ Estructura del Código Source (`src/`)

```text
src/
├── app/                 # App Router de Next.js 16 (Páginas y API Routes)
├── components/          # Componentes UI reutilizables y mapas
├── data/                # Store en memoria y adaptadores de datos
├── domain/              # Modelos de dominio, reglas de negocio y tolerancia
├── features/            # Lógica y vistas por dominio (viajes, reportes)
├── hooks/               # Custom React Hooks (useGPS, useViajes, useAuth, useSupabase)
├── integrations/        # Adaptadores externos (Locatelia)
├── lib/                 # Utilidades (Zod schemas, API response helpers, emails, exports)
└── test/                # Setup de Vitest y mocks de pruebas
```

## 💻 Comandos de Desarrollo Local

```bash
# Iniciar servidor de desarrollo
pnpm dev

# Typecheck estricto de TypeScript
pnpm typecheck

# Linter ESLint 9
pnpm lint

# Ejecutar suite de pruebas unitarias
pnpm test

# Ejecutar suite de pruebas E2E con Playwright
pnpm test:e2e

# Verificación completa previa a commit/deploy
pnpm check
```

## 🔒 Convenciones de Código
- **TypeScript**: Estricto (strict mode habilitado). Evitar `any`.
- **Validaciones**: Utilizar schemas Zod centralizados en `src/lib/schemas/`.
- **Respuestas API**: Utilizar `apiSuccess` y `apiError` de `src/lib/api-response.ts`.
- **Estilos**: Tailwind CSS / Vanilla CSS.
