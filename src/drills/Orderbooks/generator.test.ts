import { describe, expect, it } from 'vitest'
import {
  bestArbitrage,
  cashFlow,
  evaluateBoard,
  generateOrderbook,
  isHedged,
  netExposure,
  type Card,
  type OrderbookData,
  type Positions,
} from './generator'

/** Hand-built board: two items in one asset + a bundle = 1 of each. */
const card = (
  id: string,
  comp: [string, number][],
  buy: number,
  sell: number,
  isBundle = false,
): Card => ({
  id,
  name: id,
  icon: 'x',
  isBundle,
  composition: comp.map(([asset, qty]) => ({ asset, qty })),
  buy,
  sell,
})

describe('netExposure & cashFlow', () => {
  const cards = [
    card('x', [['a', 1]], 6, 4),
    card('y', [['b', 1]], 5, 3),
    card('bundle', [['a', 1], ['b', 1]], 12, 10, true),
  ]

  it('buying nets +composition, selling nets −composition', () => {
    const pos: Positions = { x: 'buy', y: 'buy', bundle: 'sell' }
    // buy x (+a), buy y (+b), sell bundle (−a −b) → all zero
    expect(netExposure(cards, pos)).toEqual({ a: 0, b: 0 })
    expect(isHedged(netExposure(cards, pos))).toBe(true)
    // cash: −6 −5 +10 = −1 (this direction loses)
    expect(cashFlow(cards, pos)).toBe(-1)
  })

  it('an unbalanced position is not hedged', () => {
    expect(isHedged(netExposure(cards, { x: 'buy', y: 'none', bundle: 'none' }))).toBe(false)
  })
})

describe('bestArbitrage', () => {
  it('finds build & sell when the bundle bid beats the parts', () => {
    const cards = [
      card('x', [['a', 1]], 5, 3),
      card('y', [['b', 1]], 5, 3),
      card('bundle', [['a', 1], ['b', 1]], 16, 14, true), // bid 14 > parts ask 10
    ]
    const best = bestArbitrage(cards)
    expect(best.cash).toBe(4) // −5 −5 +14
    expect(isHedged(netExposure(cards, best.positions))).toBe(true)
  })

  it('finds a crossed market between two venues of one asset', () => {
    const cards = [
      card('hi', [['a', 1]], 12, 10), // bid 10
      card('lo', [['a', 1]], 7, 5), // ask 7  → buy lo, sell hi = +3
    ]
    expect(bestArbitrage(cards).cash).toBe(3)
  })

  it('returns 0 (skip) when no arbitrage exists', () => {
    const cards = [
      card('x', [['a', 1]], 6, 4),
      card('y', [['b', 1]], 6, 4),
      card('bundle', [['a', 1], ['b', 1]], 13, 11, true), // bid 11 < parts ask 12, ask 13 > parts bid 8
    ]
    expect(bestArbitrage(cards).cash).toBe(0)
  })
})

describe('evaluateBoard', () => {
  const build = (cards: Card[]): OrderbookData => {
    const { positions, cash } = bestArbitrage(cards)
    return { assets: [], cards, scenario: 'components-bundle', hasArb: cash > 0, best: cash, bestPositions: positions }
  }

  it('scores the best hedged position as solved', () => {
    const data = build([
      card('x', [['a', 1]], 5, 3),
      card('y', [['b', 1]], 5, 3),
      card('bundle', [['a', 1], ['b', 1]], 16, 14, true),
    ])
    const r = evaluateBoard(data, { x: 'buy', y: 'buy', bundle: 'sell' })
    expect(r.hedged).toBe(true)
    expect(r.cash).toBe(4)
    expect(r.solved).toBe(true)
  })

  it('a hedged-but-suboptimal position is not solved', () => {
    // two independent arbs; taking only one is hedged but leaves cash on the table
    const data = build([
      card('x', [['a', 1]], 5, 3),
      card('bx', [['a', 1]], 12, 10, false),
      card('y', [['b', 1]], 5, 3),
      card('by', [['b', 1]], 12, 10, false),
    ])
    expect(data.best).toBe(10) // (10−5) + (10−5)
    const onlyOne = evaluateBoard(data, { x: 'buy', bx: 'sell', y: 'none', by: 'none' })
    expect(onlyOne.hedged).toBe(true)
    expect(onlyOne.cash).toBe(5)
    expect(onlyOne.solved).toBe(false)
  })

  it('skipping a no-arb board is solved; skipping a real arb is not', () => {
    const noArb = build([
      card('x', [['a', 1]], 6, 4),
      card('bundle', [['a', 1]], 8, 3, true),
    ])
    expect(noArb.best).toBe(0)
    expect(evaluateBoard(noArb, { x: 'none', bundle: 'none' }).solved).toBe(true)

    const arb = build([
      card('hi', [['a', 1]], 12, 10),
      card('lo', [['a', 1]], 7, 5),
    ])
    expect(evaluateBoard(arb, { hi: 'none', lo: 'none' }).solved).toBe(false)
  })

  it('an open (unhedged) position is never solved', () => {
    const data = build([
      card('x', [['a', 1]], 5, 3),
      card('y', [['b', 1]], 5, 3),
      card('bundle', [['a', 1], ['b', 1]], 16, 14, true),
    ])
    const r = evaluateBoard(data, { x: 'buy', y: 'none', bundle: 'none' })
    expect(r.hedged).toBe(false)
    expect(r.solved).toBe(false)
  })
})

describe('generateOrderbook', () => {
  it('produces sane boards, and its stored best matches a fresh brute force', () => {
    const scenarios = new Set<string>()
    let arbCount = 0
    for (let i = 0; i < 1500; i++) {
      const d = generateOrderbook()
      scenarios.add(d.scenario)
      if (d.hasArb) arbCount++

      // every card is a valid two-sided quote
      for (const c of d.cards) {
        expect(c.sell).toBeGreaterThanOrEqual(1)
        expect(c.buy).toBeGreaterThan(c.sell)
        expect(c.composition.length).toBeGreaterThan(0)
      }
      expect(d.cards.length).toBeLessThanOrEqual(5)

      // the stored best is trustworthy and internally consistent
      const fresh = bestArbitrage(d.cards)
      expect(d.best).toBe(fresh.cash)
      expect(d.hasArb).toBe(fresh.cash > 0)
      expect(isHedged(netExposure(d.cards, d.bestPositions))).toBe(true)
      expect(cashFlow(d.cards, d.bestPositions)).toBe(d.best)
      expect(d.best).toBeLessThanOrEqual(12)
    }
    // all three shapes appear, and both arb and no-arb boards occur
    expect(scenarios).toEqual(new Set(['components-bundle', 'crossed-items', 'multi-bundle']))
    expect(arbCount).toBeGreaterThan(200)
    expect(arbCount).toBeLessThan(1300)
  })
})
