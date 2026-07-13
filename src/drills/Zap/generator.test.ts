import { describe, expect, it } from 'vitest'
import { generateArrows, generateParity, generateZapQuestion } from './generator'

describe('parity questions', () => {
  it('computes the result and keys Yes to odd', () => {
    for (let i = 0; i < 500; i++) {
      const q = generateParity()
      const expected = q.op === '+' ? q.a + q.b : q.a * q.b
      expect(q.result).toBe(expected)
      expect(q.answerYes).toBe(expected % 2 === 1)
    }
  })
})

describe('arrow questions', () => {
  it('rows are 6 arrows; non-matching rows differ in exactly one position', () => {
    let matches = 0
    const n = 2000
    for (let i = 0; i < n; i++) {
      const q = generateArrows()
      expect(q.rowA).toHaveLength(6)
      expect(q.rowB).toHaveLength(6)
      const diffs = q.rowA.filter((a, j) => a !== q.rowB[j]).length
      if (q.answerYes) {
        expect(diffs).toBe(0)
        matches++
      } else {
        expect(diffs).toBe(1)
      }
    }
    // ~50% match rate
    expect(matches / n).toBeGreaterThan(0.4)
    expect(matches / n).toBeLessThan(0.6)
  })
})

describe('generateZapQuestion', () => {
  it('dispatches by mode', () => {
    expect(generateZapQuestion('parity').mode).toBe('parity')
    expect(generateZapQuestion('arrows').mode).toBe('arrows')
  })
})
