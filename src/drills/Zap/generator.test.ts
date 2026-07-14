import { describe, expect, it } from 'vitest'
import { generateZapQuestion, makeBox } from './generator'

describe('makeBox', () => {
  it('always has an equation and two 6-arrow rows, with a consistent match flag', () => {
    for (let i = 0; i < 2000; i++) {
      const b = makeBox()
      expect(b.result).toBe(b.op === '+' ? b.a + b.b : b.a * b.b)
      expect(b.rowA).toHaveLength(6)
      expect(b.rowB).toHaveLength(6)
      const diffs = b.rowA.filter((x, j) => x !== b.rowB[j]).length
      expect(b.arrowsMatch).toBe(diffs === 0)
      if (!b.arrowsMatch) expect(diffs).toBe(1)
    }
  })
})

describe('generateZapQuestion', () => {
  it('keys the answer to the active box: top→parity, bottom→arrows match', () => {
    const actives = new Set<string>()
    for (let i = 0; i < 2000; i++) {
      const q = generateZapQuestion()
      actives.add(q.active)
      // both boxes always carry an equation and arrows
      expect(q.top.rowA).toHaveLength(6)
      expect(q.bottom.rowA).toHaveLength(6)
      if (q.active === 'top') {
        expect(q.answerYes).toBe(q.top.result % 2 === 1)
      } else {
        expect(q.answerYes).toBe(q.bottom.arrowsMatch)
      }
    }
    expect(actives).toEqual(new Set(['top', 'bottom']))
  })
})
