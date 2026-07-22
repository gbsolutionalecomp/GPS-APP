'use client'

import { Button } from '@/components/ui/button'

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="state-page"><span>Error controlado</span><h1>No pudimos cargar esta sección</h1><p>La operación no modificó los datos. Puedes intentar nuevamente.</p><Button onClick={reset} type="button">Reintentar</Button></div>
}
