import { pick, rint } from '../../lib/random'

export type ZapActive = 'top' | 'bottom'

/**
 * A Zap round shows two boxes, each containing BOTH an equation and two rows of
 * arrows. The active box (highlighted) decides the question:
 *  - top active    → is the top box's equation result odd?  (Yes = odd)
 *  - bottom active → do the bottom box's two arrow rows match?  (Yes = match)
 * Within the active box, the other element is a live distractor. ← Yes / → No.
 */
export interface ZapBox {
  a: number
  b: number
  op: '+' | '×'
  result: number
  rowA: string[]
  rowB: string[]
  arrowsMatch: boolean
}

export interface ZapQuestion {
  top: ZapBox
  bottom: ZapBox
  active: ZapActive
  answerYes: boolean
}

const ARROWS = ['↑', '↓', '←', '→']

export function makeBox(): ZapBox {
  const a = rint(2, 19)
  const b = rint(2, 19)
  const op = pick(['+', '×'] as const)
  const result = op === '+' ? a + b : a * b

  const rowA = Array.from({ length: 6 }, () => pick(ARROWS))
  const match = Math.random() < 0.5
  const rowB = [...rowA]
  if (!match) {
    const i = rint(0, 5)
    rowB[i] = pick(ARROWS.filter((x) => x !== rowA[i]))
  }
  return { a, b, op, result, rowA, rowB, arrowsMatch: match }
}

export function generateZapQuestion(): ZapQuestion {
  const top = makeBox()
  const bottom = makeBox()
  const active: ZapActive = Math.random() < 0.5 ? 'top' : 'bottom'
  const answerYes = active === 'top' ? top.result % 2 === 1 : bottom.arrowsMatch
  return { top, bottom, active, answerYes }
}
