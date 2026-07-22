import type { ReactNode } from 'react'

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'info' | 'warning' | 'success' | 'danger' }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}
