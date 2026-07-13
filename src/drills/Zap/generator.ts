import { pick, rint } from '../../lib/random'

export type ZapMode = 'parity' | 'arrows'

export interface ParityQuestion {
  mode: 'parity'
  a: number
  b: number
  op: '+' | '×'
  result: number
  /** Yes = the result is odd. */
  answerYes: boolean
}

export interface ArrowsQuestion {
  mode: 'arrows'
  rowA: string[]
  rowB: string[]
  /** Yes = the rows match exactly. */
  answerYes: boolean
}

export type ZapQuestion = ParityQuestion | ArrowsQuestion

export const ZAP_MODES: { id: ZapMode; label: string }[] = [
  { id: 'parity', label: 'odd / even' },
  { id: 'arrows', label: 'arrow match' },
]

const ARROWS = ['↑', '↓', '←', '→']

export function generateParity(): ParityQuestion {
  const a = rint(2, 19)
  const b = rint(2, 19)
  const op = pick(['+', '×'] as const)
  const result = op === '+' ? a + b : a * b
  return { mode: 'parity', a, b, op, result, answerYes: result % 2 === 1 }
}

export function generateArrows(): ArrowsQuestion {
  const rowA = Array.from({ length: 6 }, () => pick(ARROWS))
  const match = Math.random() < 0.5
  const rowB = [...rowA]
  if (!match) {
    // flip exactly one arrow
    const i = rint(0, 5)
    rowB[i] = pick(ARROWS.filter((x) => x !== rowA[i]))
  }
  return { mode: 'arrows', rowA, rowB, answerYes: match }
}

export function generateZapQuestion(mode: ZapMode): ZapQuestion {
  return mode === 'parity' ? generateParity() : generateArrows()
}
