import { Icon, type IconName } from './icon'

export function MetricCard({ label, value, detail, icon, tone = 'neutral' }: { label: string; value: string | number; detail: string; icon: IconName; tone?: 'neutral' | 'info' | 'warning' | 'success' | 'danger' }) {
  return <article className={`metric-card metric-card--${tone}`}><div className="metric-card__top"><span>{label}</span><Icon name={icon}/></div><strong>{value}</strong><p>{detail}</p></article>
}
