import { pick, rint } from '../../lib/random'

/**
 * Intervals — estimate a numeric value and bracket it with a lower and upper
 * bound. Every question has an exact integer answer, so scoring is objective:
 * you're rewarded for capturing the answer in a tight interval.
 */

export type IntervalType = 'product' | 'triple' | 'square' | 'sum' | 'percent'

export interface IntervalQuestion {
  type: IntervalType
  prompt: string
  answer: number
}

export interface IntervalScore {
  hit: boolean
  /** Interval width as a fraction of the answer. */
  relWidth: number
  /** 0 (miss) … 10 (tight and correct). */
  points: number
}

export function buildProduct(a: number, b: number): IntervalQuestion {
  return { type: 'product', prompt: `Estimate ${a} × ${b}`, answer: a * b }
}

export function buildTriple(a: number, b: number, c: number): IntervalQuestion {
  return { type: 'triple', prompt: `Estimate ${a} × ${b} × ${c}`, answer: a * b * c }
}

export function buildSquare(a: number): IntervalQuestion {
  return { type: 'square', prompt: `Estimate ${a}²`, answer: a * a }
}

export function buildSum(ns: number[]): IntervalQuestion {
  return {
    type: 'sum',
    prompt: `Estimate ${ns.join(' + ')}`,
    answer: ns.reduce((s, n) => s + n, 0),
  }
}

export function buildPercent(p: number, n: number): IntervalQuestion {
  // n is a multiple of 100, so p% of n is always an integer
  return { type: 'percent', prompt: `Estimate ${p}% of ${n}`, answer: (p * n) / 100 }
}

export function generateIntervalQuestion(): IntervalQuestion {
  switch (pick<IntervalType>(['product', 'triple', 'square', 'sum', 'percent'])) {
    case 'product':
      return buildProduct(rint(13, 99), rint(13, 99))
    case 'triple':
      return buildTriple(rint(4, 19), rint(4, 19), rint(4, 19))
    case 'square':
      return buildSquare(rint(21, 99))
    case 'sum':
      return buildSum(Array.from({ length: rint(4, 5) }, () => rint(40, 600)))
    case 'percent':
      return buildPercent(pick([5, 10, 15, 20, 25, 30, 40, 60, 75]), rint(2, 9) * 100)
  }
}

/**
 * Score an interval: it must contain the answer, and tighter is better.
 * A correct-but-very-wide bracket still earns 1; a miss earns 0.
 */
export function scoreInterval(answer: number, lower: number, upper: number): IntervalScore {
  const hit = lower <= answer && answer <= upper
  const relWidth = (upper - lower) / Math.max(1, answer)
  const points = hit ? Math.max(1, Math.round(10 * (1 - Math.min(1, relWidth)))) : 0
  return { hit, relWidth, points }
}
