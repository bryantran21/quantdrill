import { describe, expect, it } from 'vitest'
import { FIRMS } from './firmData'
import { TABS } from '../tabs'

const drillIds = new Set<string>(TABS.map((t) => t.id).filter((id) => id !== 'firms' && id !== 'stats'))

describe('FIRMS', () => {
  it('has unique ids', () => {
    expect(new Set(FIRMS.map((f) => f.id)).size).toBe(FIRMS.length)
  })

  it('every firm maps to at least one real drill, with no duplicates', () => {
    for (const f of FIRMS) {
      expect(f.drills.length).toBeGreaterThan(0)
      expect(new Set(f.drills).size).toBe(f.drills.length)
      for (const d of f.drills) expect(drillIds.has(d)).toBe(true)
    }
  })

  it('every firm has a short monogram and a distinct icon hue', () => {
    for (const f of FIRMS) {
      expect(f.mono.length).toBeGreaterThan(0)
      expect(f.mono.length).toBeLessThanOrEqual(3)
      expect(f.hue).toBeGreaterThanOrEqual(0)
      expect(f.hue).toBeLessThan(360)
    }
    expect(new Set(FIRMS.map((f) => f.hue)).size).toBe(FIRMS.length)
  })

  it('Optiver covers all six of its documented OA sections', () => {
    const optiver = FIRMS.find((f) => f.id === 'optiver')!
    expect(optiver.documented).toBe(true)
    expect(new Set(optiver.drills)).toEqual(new Set(['prob', 'seq', 'like', 'intv', 'ob', 'zap']))
  })
})
