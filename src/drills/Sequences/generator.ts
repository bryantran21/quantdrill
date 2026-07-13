import { pick, rint } from '../../lib/random'
import { fracStr, reduce } from '../../lib/fraction'

export type SequenceType =
  | 'arith'
  | 'geo'
  | 'quad'
  | 'fib'
  | 'woven'
  | 'frac'
  | 'product'
  | 'geogap'
  | 'altop'

export type Term =
  | { kind: 'int'; text: string }
  | { kind: 'frac'; n: number; d: number }

export interface SequenceQuestion {
  type: SequenceType
  terms: Term[]
  /** Canonical answer: integer string, or "a/b" in lowest terms. */
  answer: string
  /** Human explanation of the rule, shown in feedback. */
  rule: string
}

export const SEQUENCE_TYPES: { id: SequenceType; label: string }[] = [
  { id: 'arith', label: 'arithmetic' },
  { id: 'geo', label: 'geometric' },
  { id: 'quad', label: 'quadratic' },
  { id: 'fib', label: 'fibonacci' },
  { id: 'woven', label: 'woven' },
  { id: 'frac', label: 'fractions' },
  { id: 'product', label: 'product' },
  { id: 'geogap', label: 'geometric gap' },
  { id: 'altop', label: 'alternating op' },
]

const int = (v: number): Term => ({ kind: 'int', text: String(v) })

export function buildArith(start: number, step: number): SequenceQuestion {
  const terms: Term[] = []
  for (let i = 0; i < 5; i++) terms.push(int(start + i * step))
  return {
    type: 'arith',
    terms,
    answer: String(start + 5 * step),
    rule: `arithmetic, common difference ${step}`,
  }
}

export function buildGeo(start: number, ratio: number): SequenceQuestion {
  const terms: Term[] = []
  for (let i = 0; i < 4; i++) terms.push(int(start * ratio ** i))
  return {
    type: 'geo',
    terms,
    answer: String(start * ratio ** 4),
    rule: `geometric, ratio ×${ratio}`,
  }
}

export function buildQuad(a: number, b: number, c: number): SequenceQuestion {
  const f = (n: number) => a * n * n + b * n + c
  const terms: Term[] = []
  for (let i = 1; i <= 5; i++) terms.push(int(f(i)))
  return {
    type: 'quad',
    terms,
    answer: String(f(6)),
    rule: `quadratic — second differences constant (${2 * a}). Next gap continues the pattern`,
  }
}

export function buildFib(x: number, y: number): SequenceQuestion {
  const vals = [x, y]
  for (let i = 0; i < 3; i++) vals.push(vals[vals.length - 2] + vals[vals.length - 1])
  return {
    type: 'fib',
    terms: vals.map(int),
    answer: String(vals[vals.length - 2] + vals[vals.length - 1]),
    rule: 'each term = sum of the previous two',
  }
}

export function buildWoven(s1: number, d1: number, s2: number, d2: number): SequenceQuestion {
  const A: number[] = []
  const B: number[] = []
  for (let i = 0; i < 4; i++) {
    A.push(s1 + i * d1)
    B.push(s2 + i * d2)
  }
  // interleave A0,B0,A1,B1,A2,B2 → the ? is the next odd-position term, A[3]
  const terms = [A[0], B[0], A[1], B[1], A[2], B[2]].map(int)
  return {
    type: 'woven',
    terms,
    answer: String(A[3]),
    rule: `woven: odd positions ${A.slice(0, 3).join(', ')} (step ${d1}); even positions ${B.slice(0, 3).join(', ')} (step ${d2}). The ? is an odd position`,
  }
}

export function buildFrac(
  nStart: number,
  nStep: number,
  dStart: number,
  dStep: number,
): SequenceQuestion {
  // numerator and denominator each follow their own arithmetic rule
  const raw: [number, number][] = []
  for (let i = 0; i < 4; i++) raw.push([nStart + i * nStep, dStart + i * dStep])
  const terms: Term[] = raw.map(([n, d]) => {
    const [rn, rd] = reduce(n, d)
    return rd === 1 ? int(rn) : { kind: 'frac', n: rn, d: rd }
  })
  return {
    type: 'frac',
    terms,
    answer: fracStr(nStart + 4 * nStep, dStart + 4 * dStep),
    rule: `fraction sequence: numerators ${raw.map((r) => r[0]).join(', ')} (step ${nStep}); denominators ${raw.map((r) => r[1]).join(', ')} (step ${dStep})`,
  }
}

export function buildProduct(x: number, y: number): SequenceQuestion {
  const vals = [x, y]
  for (let i = 0; i < 2; i++) vals.push(vals[vals.length - 2] * vals[vals.length - 1])
  return {
    type: 'product',
    terms: vals.map(int),
    answer: String(vals[vals.length - 2] * vals[vals.length - 1]),
    rule: 'each term = product of the previous two',
  }
}

export function buildGeoGap(start: number, gap: number, ratio: number): SequenceQuestion {
  // the differences themselves form a geometric sequence
  const vals = [start]
  let g = gap
  for (let i = 0; i < 4; i++) {
    vals.push(vals[vals.length - 1] + g)
    g *= ratio
  }
  const gaps: number[] = []
  for (let i = 1; i < vals.length; i++) gaps.push(vals[i] - vals[i - 1])
  return {
    type: 'geogap',
    terms: vals.map(int),
    answer: String(vals[vals.length - 1] + g),
    rule: `differences ${gaps.join(', ')} multiply by ×${ratio} each step`,
  }
}

export function buildAltOp(start: number, mul: number, sub: number): SequenceQuestion {
  // alternate ×mul then −sub, starting with ×mul
  const vals = [start]
  for (let i = 0; i < 5; i++) {
    const prev = vals[vals.length - 1]
    vals.push(i % 2 === 0 ? prev * mul : prev - sub)
  }
  // the op index for the hidden term is the number of steps already taken
  const step = vals.length - 1
  const last = vals[vals.length - 1]
  const next = step % 2 === 0 ? last * mul : last - sub
  return {
    type: 'altop',
    terms: vals.map(int),
    answer: String(next),
    rule: `alternating operations: ×${mul}, then −${sub}, repeating`,
  }
}

export function generateSequenceQuestion(enabled: SequenceType[]): SequenceQuestion {
  const t = enabled.length ? pick(enabled) : 'arith'
  switch (t) {
    case 'arith':
      return buildArith(rint(1, 20), rint(2, 12) * (Math.random() < 0.2 ? -1 : 1))
    case 'geo':
      return buildGeo(rint(2, 5), rint(2, 4))
    case 'quad':
      return buildQuad(rint(1, 3), rint(0, 4), rint(0, 5))
    case 'fib':
      return buildFib(rint(1, 4), rint(2, 6))
    case 'woven':
      return buildWoven(
        rint(1, 10),
        rint(2, 8) * (Math.random() < 0.3 ? -1 : 1),
        rint(20, 60),
        rint(2, 10) * (Math.random() < 0.6 ? -1 : 1),
      )
    case 'frac':
      return buildFrac(rint(1, 5), rint(1, 4), rint(2, 6), rint(1, 4))
    case 'product':
      return buildProduct(rint(1, 2), rint(2, 3))
    case 'geogap':
      return buildGeoGap(rint(1, 10), rint(1, 3), pick([2, 2, 3]))
    case 'altop': {
      const sub = rint(1, 5)
      return buildAltOp(sub + rint(1, 4), rint(2, 3), sub)
    }
  }
}
