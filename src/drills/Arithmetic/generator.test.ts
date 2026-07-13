import { describe, expect, it } from 'vitest'
import {
  buildAdd,
  buildDiv,
  buildMul,
  buildSub,
  generateArithmeticQuestion,
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
  it('answers are always positive integers and consistent with the prompt', () => {
    for (let i = 0; i < 1000; i++) {
      const q = generateArithmeticQuestion()
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
})
