import { redirect } from 'next/navigation'

// La programación de viajes se fusionó con /viajes (botón "Programar viaje").
// Esta ruta se conserva para no romper enlaces guardados.
export default function SchedulingRedirect() {
  redirect('/viajes?programar=1')
}
