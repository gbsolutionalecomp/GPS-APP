# Estrategia de Testing - GPS-APP

Este documento describe la arquitectura y ejecución de pruebas unitarias, de integración y End-to-End (E2E) en el proyecto.

## 🧪 Pruebas Unitarias e Integración (Vitest + React Testing Library)

Las pruebas unitarias se ejecutan utilizando **Vitest** con el entorno `jsdom`.

### Ejecución de Pruebas
```bash
# Correr todas las pruebas unitarias
pnpm test

# Correr pruebas en modo watch
pnpm test:watch

# Generar reporte de cobertura de código
pnpm test:coverage
```

### Umbral de Cobertura (Coverage Thresholds)
- **Lineas**: >= 70%
- **Funciones**: >= 70%
- **Ramas (Branches)**: >= 65%
- **Sentencias**: >= 70%

---

## 🎭 Pruebas End-to-End (Playwright)

Las pruebas E2E verifican los flujos de usuario reales simulando navegadores de escritorio (Chromium) y móviles (Pixel 7).

### Ejecución de Pruebas E2E
```bash
# Ejecutar suite completa E2E
pnpm test:e2e

# Ver el reporte HTML interactivo tras la ejecución
npx playwright show-report
```

### Especificaciones E2E Incluidas
- `tests/e2e/auth.spec.ts`: Login, logout y manejo de sesión.
- `tests/e2e/viajes.spec.ts`: Programación, asignación y filtrado de viajes.
- `tests/e2e/gps-tracking.spec.ts`: Verificación de telemetría y endpoints GPS.
- `tests/e2e/paradas.spec.ts`: Registro y justificación de paradas.
- `tests/e2e/evidencias.spec.ts`: Carga y tolerancia de fotos de odómetro.
- `tests/e2e/responsiveness.spec.ts`: Adaptabilidad en Desktop y Mobile.
- `tests/e2e/performance.spec.ts`: Tiempos de carga y rendimiento.
- `tests/e2e/accessibility.spec.ts`: Cumplimiento básico de accesibilidad ARIA.
