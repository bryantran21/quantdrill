import { describe, expect, it } from 'vitest'
import {
  buildAltOp,
  buildArith,
  buildFib,
  buildFrac,
  buildGeo,
  buildGeoGap,
  buildProduct,
  buildQuad,
  buildWoven,
  generateSequenceQuestion,
  SEQUENCE_TYPES,
  type Term,
} from './generator'
import { normFrac } from '../../lib/fraction'

const texts = (terms: Term[]) =>
  terms.map((t) => (t.kind === 'int' ? t.text : `${t.n}/${t.d}`))

describe('sequence builders compute the correct next term', () => {
  it('arithmetic: 3, 7, 11, 15, 19 → 23', () => {
    const q = buildArith(3, 4)
    expect(texts(q.terms)).toEqual(['3', '7', '11', '15', '19'])
    expect(q.answer).toBe('23')
  })

  it('geometric: 3, 6, 12, 24 → 48', () => {
    const q = buildGeo(3, 2)
    expect(texts(q.terms)).toEqual(['3', '6', '12', '24'])
    expect(q.answer).toBe('48')
  })

  it('quadratic n²+n+1: 3, 7, 13, 21, 31 → 43', () => {
    const q = buildQuad(1, 1, 1)
    expect(texts(q.terms)).toEqual(['3', '7', '13', '21', '31'])
    expect(q.answer).toBe('43')
  })

  it('fibonacci: 2, 3, 5, 8, 13 → 21', () => {
    const q = buildFib(2, 3)
    expect(texts(q.terms)).toEqual(['2', '3', '5', '8', '13'])
    expect(q.answer).toBe('21')
  })

  it('woven: ? is the 4th term of the odd-position sequence', () => {
    const q = buildWoven(1, 3, 50, -5) // A: 1,4,7,10  B: 50,45,40,35
    expect(texts(q.terms)).toEqual(['1', '50', '4', '45', '7', '40'])
    expect(q.answer).toBe('10')
  })

  it('fractions: 1/2, 2/3, 3/4, 4/5 → 5/6', () => {
    const q = buildFrac(1, 1, 2, 1)
    expect(q.answer).toBe('5/6')
  })

  it('fractions: answer is reduced to lowest terms', () => {
    // numerators 2,4,6,8,10; denominators 4,8,12,16,20 → 10/20 = 1/2
    const q = buildFrac(2, 2, 4, 4)
    expect(q.answer).toBe('1/2')
    expect(normFrac('10/20')).toBe(q.answer)
  })

  it('product: 2, 3, 6, 18 → 108', () => {
    const q = buildProduct(2, 3)
    expect(texts(q.terms)).toEqual(['2', '3', '6', '18'])
    expect(q.answer).toBe('108')
  })

  it('geometric gap: 1, 4, 10, 22, 46 → 94 (gaps 3,6,12,24,48)', () => {
    const q = buildGeoGap(1, 3, 2)
    expect(texts(q.terms)).toEqual(['1', '4', '10', '22', '46'])
    expect(q.answer).toBe('94')
  })

  it('alternating op ×2 −3: 5, 10, 7, 14, 11, 22 → 19', () => {
    const q = buildAltOp(5, 2, 3)
    expect(texts(q.terms)).toEqual(['5', '10', '7', '14', '11', '22'])
    expect(q.answer).toBe('19') // 5 steps shown → the hidden 6th step is −3
  })
})

describe('generateSequenceQuestion', () => {
  it('only generates enabled types, and falls back to arithmetic when none enabled', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateSequenceQuestion(['fib']).type).toBe('fib')
      expect(generateSequenceQuestion([]).type).toBe('arith')
    }
  })

  it('every type produces a parseable canonical answer', () => {
    for (const { id } of SEQUENCE_TYPES) {
      for (let i = 0; i < 100; i++) {
        const q = generateSequenceQuestion([id])
        expect(q.terms.length).toBeGreaterThanOrEqual(4)
        expect(normFrac(q.answer)).toBe(q.answer) // already canonical
        expect(q.rule.length).toBeGreaterThan(0)
      }
    }
  })
})
