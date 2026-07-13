import { describe, expect, it } from 'vitest'
import {
  buildAdd,
  buildDiv,
  buildMul,
  buildSub,
  DEFAULT_ARITH_CONFIG,
  generateArithmeticQuestion,
  type ArithConfig,
} from './generator'

describe('arithmetic builders', () => {
  it('addition', () => {
    expect(buildAdd(37, 58)).toEqual({ op: 'add', text: '37 + 58', answer: 95 })
  })
  it('subtraction is inverse addition, so it never goes negative', () => {
    expect(buildSub(37, 58)).toEqual({ op: 'sub', text: '95 − 37', answer: 58 })
  })
  it('multiplication', () => {
    expect(buildMul(12, 87)).toEqual({ op: 'mul', text: '12 × 87', answer: 1044 })
  })
  it('division is inverse multiplication, so it is always exact', () => {
    expect(buildDiv(12, 87)).toEqual({ op: 'div', text: '1044 ÷ 12', answer: 87 })
  })
})

describe('generateArithmeticQuestion', () => {
  it('answers are positive integers consistent with the prompt', () => {
    for (let i = 0; i < 2000; i++) {
      const q = generateArithmeticQuestion(DEFAULT_ARITH_CONFIG)
      expect(Number.isInteger(q.answer)).toBe(true)
      expect(q.answer).toBeGreaterThan(0)
      const [lhs, opSym, rhs] = q.text.split(' ')
      const a = Number(lhs)
      const b = Number(rhs)
      const recomputed =
        opSym === '+' ? a + b : opSym === '−' ? a - b : opSym === '×' ? a * b : a / b
      expect(q.answer).toBe(recomputed)
    }
  })

  it('only generates enabled operations', () => {
    const onlyMul: ArithConfig = {
      ...DEFAULT_ARITH_CONFIG,
      ops: { add: false, sub: false, mul: true, div: false },
    }
    for (let i = 0; i < 200; i++) expect(generateArithmeticQuestion(onlyMul).op).toBe('mul')
  })

  it('respects configured ranges', () => {
    const cfg: ArithConfig = {
      ops: { add: true, sub: false, mul: false, div: false },
      addA: [10, 12],
      addB: [20, 22],
      mulA: [2, 12],
      mulB: [2, 100],
    }
    for (let i = 0; i < 500; i++) {
      const q = generateArithmeticQuestion(cfg)
      const [lhs, , rhs] = q.text.split(' ')
      expect(Number(lhs)).toBeGreaterThanOrEqual(10)
      expect(Number(lhs)).toBeLessThanOrEqual(12)
      expect(Number(rhs)).toBeGreaterThanOrEqual(20)
      expect(Number(rhs)).toBeLessThanOrEqual(22)
    }
  })

  it('falls back to addition when nothing is enabled', () => {
    const none: ArithConfig = {
      ...DEFAULT_ARITH_CONFIG,
      ops: { add: false, sub: false, mul: false, div: false },
    }
    expect(generateArithmeticQuestion(none).op).toBe('add')
  })
})
