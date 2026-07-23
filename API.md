# Documentación de la API HTTP - GPS-APP

Esta documentación especifica las rutas HTTP y endpoints disponibles en la aplicación.

## 🟢 GET /api/health
Verifica el estado del servicio y la conectividad con Supabase.

### Respuesta
```json
{
  "success": true,
  "data": {
    "ok": true,
    "service": "gbs-control-viajes-gps",
    "dataMode": "demo",
    "supabase": "demo_mode",
    "checkedAt": "2026-07-23T16:00:00.000Z"
  },
  "timestamp": "2026-07-23T16:00:00.000Z"
}
```

---

## 📡 POST /api/webhooks/locatelia
Recepción de eventos y sincronización en tiempo real desde la plataforma Locatelia.

### Encabezados
- `x-locatelia-signature`: Firma HMAC SHA-256 (cuando `LOCATELIA_WEBHOOK_SECRET` está configurado).

### Respuesta
```json
{
  "success": true,
  "data": {
    "processed": 1,
    "warnings": [],
    "errors": []
  },
  "timestamp": "2026-07-23T16:00:00.000Z"
}
```

---

## 📊 GET /api/reportes/export
Exportación institucional de viajes en múltiples formatos.

### Parámetros Query
- `format`: `csv` | `excel` | `xlsx` | `pdf`

### Ejemplo
```bash
curl -O http://localhost:3000/api/reportes/export?format=excel
```
