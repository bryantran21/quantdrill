/** Thin countdown progress bar; `frac` is remaining time in [0, 1]. */
export function RunBar({ frac }: { frac: number }) {
  return (
    <div className="runbar">
      <div style={{ width: `${Math.max(0, Math.min(1, frac)) * 100}%` }} />
    </div>
  )
}
