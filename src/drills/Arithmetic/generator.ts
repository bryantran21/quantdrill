import { pick, rint } from '../../lib/random'

/**
 * Zetamac-style mental arithmetic with the classic default ranges:
 * addition 2–100, multiplication 2–12 × 2–100, with subtraction and
 * division as the exact inverses so answers are always whole numbers.
 */

export type ArithOp = 'add' | 'sub' | 'mul' | 'div'

export interface ArithmeticQuestion {
  op: ArithOp
  text: string
  answer: number
}

export function buildAdd(a: number, b: number): ArithmeticQuestion {
  return { op: 'add', text: `${a} + ${b}`, answer: a + b }
}

export function buildSub(a: number, b: number): ArithmeticQuestion {
  // (a + b) − a = b, so the operands stay in the addition range
  return { op: 'sub', text: `${a + b} − ${a}`, answer: b }
}

export function buildMul(a: number, b: number): ArithmeticQuestion {
  return { op: 'mul', text: `${a} × ${b}`, answer: a * b }
}

export function buildDiv(a: number, b: number): ArithmeticQuestion {
  // (a × b) ÷ a = b, always exact
  return { op: 'div', text: `${a * b} ÷ ${a}`, answer: b }
}

export function generateArithmeticQuestion(): ArithmeticQuestion {
  const op = pick<ArithOp>(['add', 'sub', 'mul', 'div'])
  switch (op) {
    case 'add':
      return buildAdd(rint(2, 100), rint(2, 100))
    case 'sub':
      return buildSub(rint(2, 100), rint(2, 100))
    case 'mul':
      return buildMul(rint(2, 12), rint(2, 100))
    case 'div':
      return buildDiv(rint(2, 12), rint(2, 100))
  }
}
