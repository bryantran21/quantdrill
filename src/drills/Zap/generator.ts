import { pick, rint } from '../../lib/random'

export type ZapMode = 'parity' | 'arrows'

/**
 * A single Zap round. The box always shows BOTH a number (an equation) and two
 * rows of arrows; `mode` decides which one you're being asked about this round:
 *  - parity: is the equation's result odd?  (Yes = odd)
 *  - arrows: do the two arrow rows match exactly?  (Yes = match)
 * The other element is a live distractor. Answer with ← (Yes) / → (No).
 */
export interface ZapQuestion {
  mode: ZapMode
  a: number
  b: number
  op: '+' | '×'
  result: number
  rowA: string[]
  rowB: string[]
  arrowsMatch: boolean
  answerYes: boolean
}

const ARROWS = ['↑', '↓', '←', '→']

export function parityPart(): Pick<ZapQuestion, 'a' | 'b' | 'op' | 'result'> {
  const a = rint(2, 19)
  const b = rint(2, 19)
  const op = pick(['+', '×'] as const)
  return { a, b, op, result: op === '+' ? a + b : a * b }
}

export function arrowsPart(): Pick<ZapQuestion, 'rowA' | 'rowB' | 'arrowsMatch'> {
  const rowA = Array.from({ length: 6 }, () => pick(ARROWS))
  const match = Math.random() < 0.5
  const rowB = [...rowA]
  if (!match) {
    const i = rint(0, 5)
    rowB[i] = pick(ARROWS.filter((x) => x !== rowA[i]))
  }
  return { rowA, rowB, arrowsMatch: match }
}

export function generateZapQuestion(): ZapQuestion {
  const mode: ZapMode = Math.random() < 0.5 ? 'parity' : 'arrows'
  const p = parityPart()
  const ar = arrowsPart()
  return {
    mode,
    ...p,
    ...ar,
    answerYes: mode === 'parity' ? p.result % 2 === 1 : ar.arrowsMatch,
  }
}
