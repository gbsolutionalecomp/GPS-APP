import Link from 'next/link'

export default function NotFound() {
  return <div className="state-page"><span>404</span><h1>Página no encontrada</h1><p>La sección solicitada no existe en Control de viajes y GPS.</p><Link className="button button--secondary" href="/">Volver al panel</Link></div>
}
