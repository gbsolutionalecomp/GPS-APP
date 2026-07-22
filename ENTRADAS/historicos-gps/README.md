# Bandeja de entradas · Históricos GPS

Carpeta de archivo local para los reportes que exporta la plataforma GPS (Locatelia) antes o después de subirlos a la app. **No es el mecanismo de carga**: la carga real ocurre en la app, en `Integración → Importación de respaldo` (ruta `/integracion`, componente `src/components/import-center.tsx`, endpoint `POST /api/importaciones/locatelia`).

## Para qué sirve

- Guardar copia del archivo tal como lo entrega la plataforma, organizado por vehículo, antes de subirlo.
- Tener un respaldo local en caso de que se necesite volver a importar (por ejemplo, si se agregó un vehículo nuevo al catálogo después del primer intento).
- Nunca se edita el archivo original; si se requiere una corrección, se genera una copia nueva con versión incrementada.

## Formato que la app reconoce automáticamente

El parser (`src/features/imports/locatelia-file.ts`) detecta este reporte por su hoja de datos, sin importar el nombre del archivo:

1. Hoja **`Históricos GPS`** con columnas `Fecha | Hora | Estado | Población | Zona | Provincia | Alarma | Anotaciones`.
2. Hoja **`Info`** (opcional pero recomendada) con una fila `Vehículo:` seguida de la placa — de ahí la app infiere el vehículo si el archivo no trae una columna de placa explícita.
3. Extensión `.xlsx` (también acepta `.csv`/`.txt`, pero esos formatos deben traer columnas de recorrido ya resumidas: placa, inicio, fin, distancia — no el log crudo de eventos).

La app arma los viajes agrupando eventos consecutivos `Fin Parada → Inicio Parada` (el tramo en movimiento entre dos paradas) y descarta las filas `Movimiento` intermedias. Límites: 10 MB y 2,000 filas por archivo.

## Estructura de carpetas

```
ENTRADAS/historicos-gps/
  <PLACA>/
    YYYY-MM-DD__<empresa>__<PLACA>__historicos-gps__vNN.xlsx
```

Ejemplo real ya cargado como referencia:

`RK17022/2026-07-21__secovi-sapi-de-cv__RK17022__historicos-gps__v01.xlsx`

## Flujo de trabajo

1. Descargar el reporte desde la plataforma GPS (Locatelia) para el vehículo y periodo deseado.
2. Renombrarlo según la convención de arriba y colocarlo en `ENTRADAS/historicos-gps/<PLACA>/`.
3. Verificar que el vehículo ya exista en el catálogo de la app (`/catalogos`) con la misma placa; si no existe, la fila se rechaza al importar.
4. Abrir la app → `Integración` → subir ese mismo archivo en `Importación de respaldo`.
5. Revisar el resumen: filas aceptadas, rechazadas y advertencias. Los rechazos suelen ser vehículo no encontrado o fecha inválida.
6. Conservar el archivo en esta carpeta como respaldo; no se sube nada a un repositorio remoto (ver `.gitignore`).

## Qué no hacer

- No subir archivos con contraseñas, tokens o credenciales de la plataforma.
- No editar el archivo exportado; si hace falta corregir algo, pedir un nuevo export.
- No eliminar el histórico local sin antes confirmar que la importación quedó guardada (`committed: true` en la respuesta del endpoint, o estado "Guardado" en la pantalla).
