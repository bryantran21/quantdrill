import { describe, expect, it } from 'vitest'
import { arrowsPart, generateZapQuestion, parityPart } from './generator'

describe('parity part', () => {
  it('computes the equation result', () => {
    for (let i = 0; i < 500; i++) {
      const p = parityPart()
      expect(p.result).toBe(p.op === '+' ? p.a + p.b : p.a * p.b)
    }
  })
})

describe('arrows part', () => {
  it('rows are 6 arrows; non-matching rows differ in exactly one position', () => {
    let matches = 0
    const n = 2000
    for (let i = 0; i < n; i++) {
      const a = arrowsPart()
      expect(a.rowA).toHaveLength(6)
      expect(a.rowB).toHaveLength(6)
      const diffs = a.rowA.filter((x, j) => x !== a.rowB[j]).length
      if (a.arrowsMatch) {
        expect(diffs).toBe(0)
        matches++
      } else {
        expect(diffs).toBe(1)
      }
    }
    expect(matches / n).toBeGreaterThan(0.4)
    expect(matches / n).toBeLessThan(0.6)
  })
})

describe('generateZapQuestion', () => {
  it('always includes both a number and arrows, and keys the answer to the active mode', () => {
    const modes = new Set<string>()
    for (let i = 0; i < 2000; i++) {
      const q = generateZapQuestion()
      modes.add(q.mode)
      // both elements are always present
      expect(q.result).toBe(q.op === '+' ? q.a + q.b : q.a * q.b)
      expect(q.rowA).toHaveLength(6)
      expect(q.rowB).toHaveLength(6)
      // answer depends only on the active mode
      if (q.mode === 'parity') {
        expect(q.answerYes).toBe(q.result % 2 === 1)
      } else {
        expect(q.answerYes).toBe(q.arrowsMatch)
      }
    }
    expect(modes).toEqual(new Set(['parity', 'arrows']))
  })
})
