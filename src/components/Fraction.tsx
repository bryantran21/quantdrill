/** Stacked a-over-b fraction, rendered inline with the surrounding sequence. */
export function Fraction({ n, d }: { n: number; d: number }) {
  return (
    <span className="frac">
      <span className="n">{n}</span>
      <span>{d}</span>
    </span>
  )
}
