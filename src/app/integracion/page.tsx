'use client'

import { useApp } from '@/components/app-provider'
import { ImportCenter } from '@/components/import-center'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { PageHeader } from '@/components/ui/page-header'
import { formatDateTime } from '@/domain/format'

const vendorChecklist = ['Autenticación y URL de acceso', 'Ambiente de pruebas', 'Vehículos y dispositivos', 'Recorridos, tramos y paradas', 'Avisos automáticos y firma de seguridad', 'Paginación y límites', 'Zona horaria e identificadores', 'Política de correcciones']

export default function IntegrationPage() {
  const { snapshot } = useApp()
  return <>
    <PageHeader description="Sube el archivo que exporta la plataforma GPS cada semana; la app arma los viajes automáticamente." eyebrow="Recorridos" title="Subir recorridos"/>
    <div className="content-grid">
      <div className="stack">
        <Card title="Subir archivo" subtitle="Excel, CSV o texto exportado por la plataforma GPS"><ImportCenter/></Card>
        <details className="disclosure">
          <summary>Avanzado: conexión automática y auditoría</summary>
          <div className="stack" style={{ marginTop: 14 }}>
            <Card title="Estado de la conexión" subtitle="Credenciales sólo del lado del servidor"><div className="integration-status"><span className="integration-status__icon"><Icon name="sync" size={25}/></span><div><h2>{snapshot.integration.mode === 'disabled' ? 'Conexión automática pendiente' : `Conectado (modo ${snapshot.integration.mode})`}</h2><p>Último éxito: {formatDateTime(snapshot.integration.lastSuccessfulAt)}</p></div><Badge tone={snapshot.integration.mode === 'disabled' ? 'warning' : 'success'}>{snapshot.integration.mode === 'disabled' ? 'Sólo carga manual' : 'Disponible'}</Badge></div><div className="summary-grid" style={{ marginTop: 18 }}><div className="summary-box"><span>Intervalo</span><strong>{snapshot.integration.pollIntervalMinutes} min</strong></div><div className="summary-box"><span>Último intento</span><strong>{formatDateTime(snapshot.integration.lastSyncedAt)}</strong></div><div className="summary-box"><span>Protocolo</span><strong>Servidor a servidor</strong></div></div></Card>
            <Card className="card--flush" title="Cargas recientes" subtitle="Auditoría de subidas y sincronizaciones"><div className="table-wrap"><table className="data-table"><thead><tr><th>Inicio</th><th>Fuente</th><th>Recibidos</th><th>Insertados</th><th>Actualizados</th><th>Estado</th></tr></thead><tbody>{snapshot.syncRuns.map((run) => <tr key={run.id}><td className="mono">{formatDateTime(run.startedAt)}</td><td>{run.source.replaceAll('_', ' ')}</td><td>{run.received}</td><td>{run.inserted}</td><td>{run.updated}</td><td><Badge tone={run.status === 'success' ? 'success' : run.status === 'error' ? 'danger' : 'warning'}>{run.status}</Badge></td></tr>)}</tbody></table></div></Card>
            <Card title="Datos a solicitar al proveedor" subtitle="Para activar la conexión en tiempo real"><div className="catalog-list">{vendorChecklist.map((item) => <div className="catalog-item" key={item}><Icon name="check" size={15}/><div><strong>{item}</strong><small>Confirmación técnica requerida</small></div></div>)}</div></Card>
          </div>
        </details>
      </div>
    </div>
  </>
}
