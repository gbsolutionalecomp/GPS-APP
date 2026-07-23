# Funcionalidades Principales - GPS-APP

Resumen de las características implementadas en el sistema de control de viajes y evidencia GPS.

## 📌 Features

1. **Control de Viajes y Programación**
   - Asignación de vehículos, proyectos e ingenieros.
   - Seguimiento del ciclo de vida del viaje: `programado`, `en_curso`, `finalizado`, `sin_evidencia`, `evidencia_invalida`, `completado`.

2. **Integración de Telemetría Locatelia**
   - Importación de archivos CSV/Excel de históricos GPS.
   - Adaptador flexible de encabezados y deduplicación por huella SHA-256.
   - Webhook en tiempo real firmado con HMAC.

3. **Validación de Evidencias de Odómetro**
   - Carga de imágenes de odómetro inicial y final.
   - Cálculo automático de diferencia de kilometraje y contraste contra GPS.
   - Detección de desviaciones mayores a la tolerancia permitida (3 km).

4. **Visualización de Mapas y Paradas**
   - Componente interactivo `MapView` con resumen de coordenadas y paradas.
   - Justificación y reporte de paradas no programadas.

5. **Exportación de Reportes**
   - Generación instantánea de reportes en PDF, Excel y CSV.

6. **Notificaciones de Correo (Resend)**
   - Correo de aviso al asignar viaje.
   - Recordatorios automáticos de evidencias pendientes.
