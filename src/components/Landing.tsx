import type { ReactNode } from 'react'

interface LandingProps {
  children: ReactNode
  onStart: () => void
  startLabel?: string
  /** Disable Start when the config is invalid (e.g. no options selected). */
  disabled?: boolean
}

/** Pre-run config screen: holds a drill's settings and the Start button. */
export function Landing({ children, onStart, startLabel = 'Start', disabled }: LandingProps) {
  return (
    <div className="card">
      <div className="landing">
        {children}
        <div className="start-row">
          <button type="button" className="btn" onClick={onStart} disabled={disabled}>
            {startLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
