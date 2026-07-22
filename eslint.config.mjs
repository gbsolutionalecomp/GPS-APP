import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const config = [
  ...nextVitals,
  ...nextTs,
  { ignores: ['.next/**', 'coverage/**', 'playwright-report/**', 'test-results/**', 'supabase/functions/**'] },
]

export default config
