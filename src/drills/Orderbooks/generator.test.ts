import { describe, expect, it } from 'vitest'
import {
  bestArbitrage,
  cashFlow,
  evaluateBoard,
  generateOrderbook,
  isHedged,
  maxQty,
  netExposure,
  type Card,
  type OrderbookData,
  type Positions,
} from './generator'

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

const build = (cards: Card[]): OrderbookData => {
  const { positions, cash } = bestArbitrage(cards)
  return {
    assets: [],
    cards,
    scenario: 'components-bundle',
    maxUnits: maxQty(cards),
    hasArb: cash > 0,
    best: cash,
    bestPositions: positions,
  }
}

describe('netExposure & cashFlow with integer quantities', () => {
  const cards = [
    card('x', [['a', 1]], 6, 4),
    card('y', [['b', 1]], 5, 3),
    card('bundle', [['a', 1], ['b', 1]], 12, 10, true),
  ]

  it('buying q nets +q·composition, selling nets −q·composition', () => {
    // buy 1 x (+a), buy 1 y (+b), sell 1 bundle (−a −b) → flat
    const pos: Positions = { x: 1, y: 1, bundle: -1 }
    expect(netExposure(cards, pos)).toEqual({ a: 0, b: 0 })
    expect(isHedged(netExposure(cards, pos))).toBe(true)
    expect(cashFlow(cards, pos)).toBe(-1) // −6 −5 +10
  })

  it('cash scales with quantity', () => {
    expect(cashFlow(cards, { x: 2, bundle: 0 })).toBe(-12) // buy 2 x
    expect(cashFlow(cards, { x: -2 })).toBe(8) // sell 2 x at bid 4
  })
})

describe('bestArbitrage', () => {
  it('needs 2 units of an item to hedge a bundle that holds 2 of it', () => {
    // bundle = 2 salt; build & sell: buy 2 salt (pay 2×5=10), sell bundle (recv 13)
    const cards = [card('salt', [['a', 1]], 5, 3), card('kit', [['a', 2]], 15, 13, true)]
    expect(maxQty(cards)).toBe(2)
    const best = bestArbitrage(cards)
    expect(best.cash).toBe(3) // 13 − 10
    expect(best.positions).toMatchObject({ salt: 2, kit: -1 })
    expect(isHedged(netExposure(cards, best.positions))).toBe(true)
  })

  it('finds a crossed market between two venues of one asset', () => {
    const cards = [card('hi', [['a', 1]], 12, 10), card('lo', [['a', 1]], 7, 5)]
    expect(bestArbitrage(cards).cash).toBe(3) // buy lo 7, sell hi 10
  })

  it('does not let a single-unit edge scale past the bundle quantity', () => {
    // K = 1 here, so the crossed arb can only be done once
    const cards = [card('hi', [['a', 1]], 12, 10), card('lo', [['a', 1]], 7, 5)]
    expect(maxQty(cards)).toBe(1)
    expect(bestArbitrage(cards).cash).toBe(3)
  })

  it('returns 0 (skip) when no arbitrage exists', () => {
    const cards = [
      card('x', [['a', 1]], 6, 4),
      card('y', [['b', 1]], 6, 4),
      card('bundle', [['a', 1], ['b', 1]], 13, 11, true),
    ]
    expect(bestArbitrage(cards).cash).toBe(0)
  })
})

describe('evaluateBoard', () => {
  it('scores the best hedged position as solved, including 2-unit hedges', () => {
    const data = build([card('salt', [['a', 1]], 5, 3), card('kit', [['a', 2]], 15, 13, true)])
    expect(data.best).toBe(3)
    expect(evaluateBoard(data, { salt: 2, kit: -1 }).solved).toBe(true)
    // buying only 1 salt leaves you short a salt → open position
    const open = evaluateBoard(data, { salt: 1, kit: -1 })
    expect(open.hedged).toBe(false)
    expect(open.solved).toBe(false)
  })

  it('a hedged-but-suboptimal position is not solved', () => {
    const data = build([
      card('x', [['a', 1]], 5, 3),
      card('bx', [['a', 1]], 12, 10),
      card('y', [['b', 1]], 5, 3),
      card('by', [['b', 1]], 12, 10),
    ])
    expect(data.best).toBe(10)
    const one = evaluateBoard(data, { x: 1, bx: -1 })
    expect(one.hedged).toBe(true)
    expect(one.cash).toBe(5)
    expect(one.solved).toBe(false)
  })

  it('skipping a no-arb board is solved; skipping a real arb is not', () => {
    const noArb = build([card('x', [['a', 1]], 6, 4), card('bundle', [['a', 1]], 8, 3, true)])
    expect(noArb.best).toBe(0)
    expect(evaluateBoard(noArb, {}).solved).toBe(true)

    const arb = build([card('hi', [['a', 1]], 12, 10), card('lo', [['a', 1]], 7, 5)])
    expect(evaluateBoard(arb, {}).solved).toBe(false)
  })
})

describe('generateOrderbook', () => {
  it('produces sane boards, and its stored best matches a fresh brute force', () => {
    const scenarios = new Set<string>()
    let arbCount = 0
    let sawMultiUnit = false
    for (let i = 0; i < 1200; i++) {
      const d = generateOrderbook()
      scenarios.add(d.scenario)
      if (d.hasArb) arbCount++
      if (Object.values(d.bestPositions).some((q) => Math.abs(q) >= 2)) sawMultiUnit = true

      for (const c of d.cards) {
        expect(c.sell).toBeGreaterThanOrEqual(1)
        expect(c.buy).toBeGreaterThan(c.sell)
        expect(c.composition.length).toBeGreaterThan(0)
      }
      expect(d.cards.length).toBeLessThanOrEqual(5)

      const fresh = bestArbitrage(d.cards)
      expect(d.best).toBe(fresh.cash)
      expect(d.hasArb).toBe(fresh.cash > 0)
      expect(isHedged(netExposure(d.cards, d.bestPositions))).toBe(true)
      expect(cashFlow(d.cards, d.bestPositions)).toBe(d.best)
      expect(d.best).toBeLessThanOrEqual(14)
      // no position exceeds the board's unit cap
      for (const q of Object.values(d.bestPositions)) {
        expect(Math.abs(q)).toBeLessThanOrEqual(d.maxUnits)
      }
    }
    expect(scenarios).toEqual(new Set(['components-bundle', 'crossed-items', 'multi-bundle']))
    expect(arbCount).toBeGreaterThan(150)
    expect(arbCount).toBeLessThan(1100)
    expect(sawMultiUnit).toBe(true) // some solutions require buying/selling ≥2 units
  })
})
