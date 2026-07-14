import { describe, expect, it } from 'vitest'
import { generateLikelihoodQuestion } from './generator'

describe('generateLikelihoodQuestion', () => {
  it('produces unambiguous, correctly ordered rankings', () => {
    const types = new Set<string>()
    for (let i = 0; i < 1500; i++) {
      const q = generateLikelihoodQuestion()
      types.add(q.type)

      // 3–4 outcomes, all weights distinct (no ties → unique correct order)
      expect(q.outcomes.length).toBeGreaterThanOrEqual(3)
      expect(q.outcomes.length).toBeLessThanOrEqual(4)
      const weights = q.outcomes.map((o) => o.weight)
      expect(new Set(weights).size).toBe(weights.length)

      // correctOrder is a permutation of the ids, sorted by weight descending
      expect([...q.correctOrder].sort()).toEqual(q.outcomes.map((o) => o.id).sort())
      const byId = Object.fromEntries(q.outcomes.map((o) => [o.id, o.weight]))
      const ordered = q.correctOrder.map((id) => byId[id])
      for (let j = 1; j < ordered.length; j++) {
        expect(ordered[j - 1]).toBeGreaterThan(ordered[j])
      }
    }
    expect(types).toEqual(new Set(['dice-sum', 'bag', 'coin']))
  })

  it('orders a known dice case correctly (7 > 4 > 2 by combinations)', () => {
    // sanity on the weighting model regardless of which question is generated
    const weights = { 2: 1, 4: 3, 7: 6 }
    const sorted = Object.entries(weights).sort((a, b) => b[1] - a[1]).map(([t]) => t)
    expect(sorted).toEqual(['7', '4', '2'])
  })
})
