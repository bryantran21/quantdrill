import { describe, expect, it } from 'vitest'
import {
  buildBayes,
  buildBinom,
  buildComp,
  buildCond,
  buildEv,
  buildGeoQ,
  buildLin,
  generateProbQuestion,
  makeMoneyOpts,
  makeNumOpts,
  makeProbOpts,
  PROB_TYPES,
  type ProbQuestion,
} from './generator'

const correctLabel = (q: ProbQuestion) => q.options.find((o) => o.correct)!.label

describe('probability builders compute known-correct answers', () => {
  it('expected value: pay $5, p=0.25 to win $20 → net EV $0.00', () => {
    const q = buildEv(5, 20, 0.25, 2)
    expect(q.answer).toBe(0)
    expect(correctLabel(q)).toBe('+$0.00')
  })

  it('expected value: pay $4, p=0.1 to win $30 → net EV −$1.00', () => {
    const q = buildEv(4, 30, 0.1, 1)
    expect(q.answer).toBe(-1)
    expect(correctLabel(q)).toBe('−$1.00')
  })

  it('complement: at least one six in 2 rolls = 1 − (5/6)² ≈ 0.31', () => {
    expect(buildComp(2, 6).answer).toBe(0.31)
  })

  it('complement: at least one six in 4 rolls = 1 − (5/6)⁴ ≈ 0.52', () => {
    expect(buildComp(4, 6).answer).toBe(0.52)
  })

  it('binomial: exactly 2 of 4 at p=1/2 = C(4,2)·(1/2)⁴ = 0.375 → 0.38', () => {
    expect(buildBinom(4, 2, 0.5).answer).toBe(0.38)
  })

  it('binomial: exactly 1 of 3 at p=1/3 = 3·(1/3)·(2/3)² ≈ 0.44', () => {
    expect(buildBinom(3, 1, 1 / 3).answer).toBe(0.44)
  })

  it('bayes via 1000 people: 1% base, 90% accurate → 9/(9+99) ≈ 0.08', () => {
    expect(buildBayes(1, 90).answer).toBe(0.08)
  })

  it('bayes via 1000 people: 5% base, 95% accurate → 47.5/(47.5+47.5) = 0.5', () => {
    expect(buildBayes(5, 95).answer).toBe(0.5)
  })

  it('conditional without replacement: 4 red, 3 blue → 4/7 · 3/6 ≈ 0.29', () => {
    expect(buildCond(4, 3).answer).toBe(0.29)
  })

  it('linearity: 30 tries at 1/6 → 5 expected successes', () => {
    expect(buildLin(30, [1, 6]).answer).toBe(5)
  })

  it('geometric: success 1/6 per trial → 6 expected trials', () => {
    expect(buildGeoQ([1, 6]).answer).toBe(6)
  })
})

describe('option helpers', () => {
  it('always produce 4 options with exactly one correct', () => {
    for (let i = 0; i < 200; i++) {
      for (const opts of [
        makeMoneyOpts(Math.round(Math.random() * 20 - 5), 1 + (i % 3)),
        makeProbOpts(Math.round(Math.random() * 100) / 100),
        makeNumOpts(Math.floor(Math.random() * 12)),
      ]) {
        expect(opts).toHaveLength(4)
        expect(opts.filter((o) => o.correct)).toHaveLength(1)
        expect(new Set(opts.map((o) => o.label)).size).toBe(4)
      }
    }
  })

  it('probability options stay within [0, 1]', () => {
    for (let i = 0; i < 200; i++) {
      for (const o of makeProbOpts(Math.round(Math.random() * 100) / 100)) {
        const v = Number(o.label)
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(1)
      }
    }
  })
})

describe('generateProbQuestion', () => {
  it('respects enabled types and falls back to expected value', () => {
    for (const { id } of PROB_TYPES) {
      for (let i = 0; i < 25; i++) {
        const q = generateProbQuestion([id])
        expect(q.type).toBe(id)
        expect(q.options.filter((o) => o.correct)).toHaveLength(1)
        expect(q.work.length).toBeGreaterThan(0)
      }
    }
    expect(generateProbQuestion([]).type).toBe('ev')
  })
})
