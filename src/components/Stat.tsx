import type { ReactNode } from 'react'

interface StatProps {
  value: ReactNode
  label: string
  /** Timer warning tone: 'low' (amber) or 'crit' (red). */
  tone?: 'low' | 'crit'
}

export function Stat({ value, label, tone }: StatProps) {
  return (
    <div className="stat">
      <div className={'v' + (tone ? ` ${tone}` : '')}>{value}</div>
      <div className="l">{label}</div>
    </div>
  )
}
