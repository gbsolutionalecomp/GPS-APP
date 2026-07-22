import type { ReactNode } from 'react'

export function Card({ title, subtitle, action, children, className = '' }: { title?: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`card ${className}`.trim()}>{title || subtitle || action ? <header className="card__header"><div>{title ? <h2>{title}</h2> : null}{subtitle ? <p>{subtitle}</p> : null}</div>{action}</header> : null}<div className="card__content">{children}</div></section>
}
