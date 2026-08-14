/** Static formula reference shown on the Beat the Odds landing screen. */

const TOOLS: { formula: string; use: string }[] = [
  { formula: '1 / p', use: 'geometric — expected tries until the first success' },
  { formula: 'n · p', use: 'linearity — expected number of successes in n trials' },
  { formula: '1 − (1 − p)ⁿ', use: 'complement — at least one success in n tries' },
  { formula: 'C(n,k)·pᵏ·(1−p)ⁿ⁻ᵏ', use: 'binomial — exactly k successes in n' },
  { formula: '1000-people method', use: 'Bayes — turn base rate + accuracy into a real chance' },
  { formula: 'k / N', use: "gambler's ruin (fair) — reach N from k before hitting 0" },
  { formula: 'n · Hₙ', use: 'coupon collector — expected draws to get all n types' },
  { formula: 'HH → 6,  HT → 4', use: 'expected fair-coin flips until the pattern appears' },
  { formula: '(2m − 1) / 36', use: 'two dice — probability the higher one equals m' },
  { formula: '((7 − m) / 6)²', use: 'two dice — probability both are at least m' },
  { formula: 'r/N · (r−1)/(N−1)', use: 'two draws, no replacement — both of a kind' },
]

export function CheatSheet() {
  return (
    <details className="cheatsheet">
      <summary>Formula cheat sheet</summary>
      <div className="cheatsheet-body">
        {TOOLS.map((t) => (
          <div className="cheat-row" key={t.formula}>
            <span className="cheat-formula">{t.formula}</span>
            <span className="cheat-use">{t.use}</span>
          </div>
        ))}
      </div>
    </details>
  )
}
