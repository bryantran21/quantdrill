import { pick, rint } from '../../lib/random'

/**
 * Zetamac-style mental arithmetic. Ranges are configurable per operation;
 * subtraction is addition reversed and division is multiplication reversed,
 * exactly as Zetamac does it, so answers are always whole and non-negative.
 */

export type ArithOp = 'add' | 'sub' | 'mul' | 'div'

export type Range = [number, number]

export interface ArithConfig {
  ops: Record<ArithOp, boolean>
  /** a + b, and (reversed) subtraction is drawn from the same two ranges. */
  addA: Range
  addB: Range
  /** a × b, and (reversed) division is drawn from the same two ranges. */
  mulA: Range
  mulB: Range
}

export const DEFAULT_ARITH_CONFIG: ArithConfig = {
  ops: { add: true, sub: true, mul: true, div: true },
  addA: [2, 100],
  addB: [2, 100],
  mulA: [2, 12],
  mulB: [2, 100],
}

export interface ArithmeticQuestion {
  op: ArithOp
  text: string
  answer: number
}

export function buildAdd(a: number, b: number): ArithmeticQuestion {
  return { op: 'add', text: `${a} + ${b}`, answer: a + b }
}

export function buildSub(a: number, b: number): ArithmeticQuestion {
  // (a + b) − a = b, so the operands stay inside the addition ranges
  return { op: 'sub', text: `${a + b} − ${a}`, answer: b }
}

export function buildMul(a: number, b: number): ArithmeticQuestion {
  return { op: 'mul', text: `${a} × ${b}`, answer: a * b }
}

export function buildDiv(a: number, b: number): ArithmeticQuestion {
  // (a × b) ÷ a = b, always exact
  return { op: 'div', text: `${a * b} ÷ ${a}`, answer: b }
}

const r = (range: Range) => rint(range[0], range[1])

export function generateArithmeticQuestion(cfg: ArithConfig): ArithmeticQuestion {
  const enabled = (['add', 'sub', 'mul', 'div'] as const).filter((o) => cfg.ops[o])
  const op = enabled.length ? pick(enabled) : 'add'
  switch (op) {
    case 'add':
      return buildAdd(r(cfg.addA), r(cfg.addB))
    case 'sub':
      return buildSub(r(cfg.addA), r(cfg.addB))
    case 'mul':
      return buildMul(r(cfg.mulA), r(cfg.mulB))
    case 'div':
      return buildDiv(r(cfg.mulA), r(cfg.mulB))
  }
}
