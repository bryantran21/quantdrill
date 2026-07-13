import type { ReactNode } from 'react'

export interface ScoreLine {
  label: string
  value: ReactNode
}

interface ScorecardProps {
  /** Headline number, e.g. the final score. */
  headline: ReactNode
  headlineUnit?: string
  lines: ScoreLine[]
  onAgain: () => void
  onSettings: () => void
}

/** End-of-run summary with the same controls for every drill. */
export function Scorecard({
  headline,
  headlineUnit,
  lines,
  onAgain,
  onSettings,
}: ScorecardProps) {
  return (
    <div className="card">
      <div className="scorecard">
        <div className="big">
          {headline}
          {headlineUnit && <span className="unit">{headlineUnit}</span>}
        </div>
        {lines.length > 0 && (
          <div className="score-lines">
            {lines.map((l) => (
              <div className="sl" key={l.label}>
                <div className="v">{l.value}</div>
                <div className="l">{l.label}</div>
              </div>
            ))}
          </div>
        )}
        <div className="start-row">
          <button type="button" className="btn" onClick={onAgain}>
            Go again
          </button>
          <button type="button" className="btn ghost" onClick={onSettings}>
            Settings
          </button>
        </div>
      </div>
    </div>
  )
}
