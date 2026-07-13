import { describe, expect, it } from 'vitest'
import {
  BUNDLE,
  evaluateOrderbook,
  generateOrderbook,
  type ObAction,
  type OrderbookData,
} from './generator'

const actionsFor = (
  data: OrderbookData,
  parts: ObAction,
  bundle: ObAction,
): Record<string, ObAction> => {
  const acts: Record<string, ObAction> = { [BUNDLE]: bundle }
  for (const i of data.items) acts[i.name] = parts
  return acts
}

describe('generateOrderbook invariants', () => {
  it('bid < ask on every book, all prices ≥ 1, and profits match the quoted prices', () => {
    for (let i = 0; i < 1000; i++) {
      const d = generateOrderbook()
      for (const row of [...d.items, d.bundle]) {
        expect(row.bid).toBeLessThan(row.ask)
        expect(row.bid).toBeGreaterThanOrEqual(1)
      }
      expect(d.partsAskSum).toBe(d.items.reduce((s, r) => s + r.ask, 0))
      expect(d.partsBidSum).toBe(d.items.reduce((s, r) => s + r.bid, 0))
      // arbitrage direction math: buy at ask, sell at bid
      expect(d.buildSell).toBe(d.bundle.bid - d.partsAskSum)
      expect(d.buyBreak).toBe(d.partsBidSum - d.bundle.ask)
      expect(d.best).toBe(Math.max(d.buildSell, d.buyBreak, 0))
    }
  })

  it('each scenario creates the arbitrage it claims (and only that one)', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 1000; i++) {
      const d = generateOrderbook()
      seen.add(d.scenario)
      if (d.scenario === 'buildSell') {
        expect(d.buildSell).toBeGreaterThan(0)
        expect(d.buyBreak).toBeLessThanOrEqual(0)
      } else if (d.scenario === 'buyBreak') {
        expect(d.buyBreak).toBeGreaterThan(0)
        expect(d.buildSell).toBeLessThanOrEqual(0)
      } else {
        expect(d.buildSell).toBeLessThanOrEqual(0)
        expect(d.buyBreak).toBeLessThanOrEqual(0)
        expect(d.best).toBe(0)
      }
    }
    expect(seen).toEqual(new Set(['buildSell', 'buyBreak', 'none']))
  })
})

describe('evaluateOrderbook', () => {
  it('scores build & sell only when it is the best direction', () => {
    for (let i = 0; i < 500; i++) {
      const d = generateOrderbook()
      const r = evaluateOrderbook(d, actionsFor(d, 'buy', 'sell'))
      expect(r.valid).toBe(true)
      expect(r.profit).toBe(d.buildSell)
      expect(r.solved).toBe(d.scenario === 'buildSell')
    }
  })

  it('scores buy & break only when it is the best direction', () => {
    for (let i = 0; i < 500; i++) {
      const d = generateOrderbook()
      const r = evaluateOrderbook(d, actionsFor(d, 'sell', 'buy'))
      expect(r.valid).toBe(true)
      expect(r.profit).toBe(d.buyBreak)
      expect(r.solved).toBe(d.scenario === 'buyBreak')
    }
  })

  it('scores a full skip only on a no-arb book', () => {
    for (let i = 0; i < 500; i++) {
      const d = generateOrderbook()
      const r = evaluateOrderbook(d, actionsFor(d, 'skip', 'skip'))
      expect(r.valid).toBe(true)
      expect(r.profit).toBe(0)
      expect(r.solved).toBe(d.scenario === 'none')
    }
  })

  it('rejects positions that are not closed', () => {
    const d = generateOrderbook()
    // buying parts without selling the bundle is not a closed position
    const r = evaluateOrderbook(d, actionsFor(d, 'buy', 'skip'))
    expect(r.valid).toBe(false)
    expect(r.solved).toBe(false)
    expect(r.profit).toBeNull()

    // mixed part actions are also invalid
    const acts = actionsFor(d, 'buy', 'sell')
    acts[d.items[0].name] = 'sell'
    expect(evaluateOrderbook(d, acts).valid).toBe(false)
  })
})
