import { pick, rint, shuffle } from '../../lib/random'
import { comb, round } from '../../lib/math'

export type ProbType = 'ev' | 'comp' | 'binom' | 'bayes' | 'cond' | 'lin' | 'geo'

export interface ProbOption {
  label: string
  correct: boolean
}

export interface ProbQuestion {
  type: ProbType
  /** Prompt HTML (only markup we generate ourselves: <b>, <sup>). */
  prompt: string
  options: ProbOption[]
  /** Worked-solution HTML shown after answering. */
  work: string
  /** The numeric answer the correct option encodes. */
  answer: number
}

export const PROB_TYPES: { id: ProbType; label: string }[] = [
  { id: 'ev', label: 'expected value' },
  { id: 'comp', label: 'complement' },
  { id: 'binom', label: 'binomial' },
  { id: 'bayes', label: 'bayes' },
  { id: 'cond', label: 'conditional' },
  { id: 'lin', label: 'linearity' },
  { id: 'geo', label: 'geometric' },
]

/* ---------- distractor helpers (ported from the prototype) ---------- */

export function makeMoneyOpts(correct: number, spread: number): ProbOption[] {
  const set = new Set<number>([correct])
  const cands = [correct + spread, correct - spread, correct + 2 * spread, -correct, correct * 2, 0]
  for (const c of shuffle(cands)) {
    if (set.size >= 4) break
    set.add(round(c, 2))
  }
  let fill = 3
  while (set.size < 4) set.add(round(correct + fill++, 2))
  return shuffle([...set]).map((v) => ({
    label: (v < 0 ? '−$' : '+$') + Math.abs(v).toFixed(2),
    correct: v === correct,
  }))
}

export function makeProbOpts(correct: number): ProbOption[] {
  const set = new Set<number>([correct])
  const cands = [
    round(1 - correct, 2),
    round(correct / 2, 2),
    round(Math.min(0.99, correct * 1.6), 2),
    round(correct + 0.17, 2),
    round(Math.abs(correct - 0.25), 2),
    0.5,
  ]
  for (const c of shuffle(cands)) {
    if (set.size >= 4) break
    if (c >= 0 && c <= 1) set.add(c)
  }
  while (set.size < 4) set.add(round(Math.random(), 2))
  return shuffle([...set]).map((v) => ({ label: v.toFixed(2), correct: v === correct }))
}

export function makeNumOpts(correct: number): ProbOption[] {
  const set = new Set<number>([correct])
  const cands = [correct + 1, correct - 1, correct * 2, Math.round(correct / 2), correct + 2, 0]
  for (const c of shuffle(cands)) {
    if (set.size >= 4) break
    if (c >= 0) set.add(c)
  }
  while (set.size < 4) set.add(rint(0, correct + 3))
  return shuffle([...set]).map((v) => ({ label: String(v), correct: v === correct }))
}

/* ---------- question builders (pure given their params) ---------- */

export function buildEv(cost: number, win: number, p: number, spread: number): ProbQuestion {
  const ev = round(p * win - cost, 2)
  return {
    type: 'ev',
    prompt: `You pay <b>$${cost}</b> to play. With probability <b>${p}</b> you win <b>$${win}</b>, otherwise nothing. What's your <b>net</b> expected value?`,
    options: makeMoneyOpts(ev, spread),
    work: `EV of the payout = ${p} × $${win} = $${round(p * win, 2)}. Net = ${round(p * win, 2)} − ${cost} = <b>$${ev}</b>. ${ev >= 0 ? 'Positive → play.' : "Negative → don't play."}`,
    answer: ev,
  }
}

export function buildComp(n: number, target: number): ProbQuestion {
  const pFail = 5 / 6
  const ans = round(1 - pFail ** n, 2)
  return {
    type: 'comp',
    prompt: `You roll a fair die <b>${n} times</b>. Probability of <b>at least one ${target}</b>?`,
    options: makeProbOpts(ans),
    work: `P(none) = (5/6)<sup>${n}</sup> = ${round(pFail ** n, 3)}. P(at least one) = 1 − ${round(pFail ** n, 3)} = <b>${ans}</b>. Multiply the failure fraction, once per roll.`,
    answer: ans,
  }
}

function probLabel(p: number): string {
  if (p === 0.5) return '1/2'
  if (Math.abs(p - 1 / 3) < 1e-9) return '1/3'
  if (p === 0.25) return '1/4'
  if (p === 0.2) return '1/5'
  if (p === 0.6) return '3/5'
  return String(p)
}

export function buildBinom(n: number, k: number, p: number): ProbQuestion {
  const ans = round(comb(n, k) * p ** k * (1 - p) ** (n - k), 2)
  return {
    type: 'binom',
    prompt: `An event happens with probability <b>${probLabel(p)}</b> each try. In <b>${n}</b> tries, probability of <b>exactly ${k}</b>?`,
    options: makeProbOpts(ans),
    work: `Binomial: C(${n},${k}) × p<sup>${k}</sup> × (1−p)<sup>${n - k}</sup> = ${comb(n, k)} × ${round(p ** k, 3)} × ${round((1 - p) ** (n - k), 3)} = <b>${ans}</b>. C(${n},${k}) = ${comb(n, k)}.`,
    answer: ans,
  }
}

export function buildBayes(basePct: number, accPct: number): ProbQuestion {
  // the "imagine 1000 people" method
  const N = 1000
  const sick = (N * basePct) / 100
  const healthy = N - sick
  const truePos = (sick * accPct) / 100
  const falsePos = (healthy * (100 - accPct)) / 100
  const ans = round(truePos / (truePos + falsePos), 2)
  return {
    type: 'bayes',
    prompt: `<b>${basePct}%</b> of people have a condition. A test is <b>${accPct}%</b> accurate both ways. You test <b>positive</b>. Probability you actually have it?`,
    options: makeProbOpts(ans),
    work: `Imagine ${N} people: ${sick} have it, ${healthy} don't. True positives = ${accPct}% × ${sick} = ${round(truePos, 1)}. False positives = ${100 - accPct}% × ${healthy} = ${round(falsePos, 1)}. Answer = ${round(truePos, 1)} ÷ (${round(truePos, 1)}+${round(falsePos, 1)}) = <b>${ans}</b>. The base rate dominates.`,
    answer: ans,
  }
}

export function buildCond(r: number, b: number): ProbQuestion {
  const tot = r + b
  const ans = round((r / tot) * ((r - 1) / (tot - 1)), 2)
  return {
    type: 'cond',
    prompt: `A bag has <b>${r} red</b> and <b>${b} blue</b>. You draw <b>2 without replacement</b>. Probability <b>both red</b>?`,
    options: makeProbOpts(ans),
    work: `${r}/${tot} × ${r - 1}/${tot - 1} = <b>${ans}</b>. Second draw drops both counts: one fewer red, one fewer total.`,
    answer: ans,
  }
}

export function buildLin(n: number, p: [number, number]): ProbQuestion {
  const ans = round((n * p[0]) / p[1], 2)
  return {
    type: 'lin',
    prompt: `You do something <b>${n} times</b>, each with probability <b>${p[0]}/${p[1]}</b> of success. Expected <b>number</b> of successes?`,
    options: makeNumOpts(Math.round(ans)),
    work: `Linearity: ${n} × ${p[0]}/${p[1]} = <b>${ans}</b>. Just multiply count × probability — ignore any dependence.`,
    answer: Math.round(ans),
  }
}

export function buildGeoQ(p: [number, number]): ProbQuestion {
  const ans = p[1] / p[0]
  return {
    type: 'geo',
    prompt: `You repeat a trial with success probability <b>${p[0]}/${p[1]}</b> until it succeeds. Expected number of trials?`,
    options: makeNumOpts(ans),
    work: `Geometric distribution: E = 1 / p = 1 / (${p[0]}/${p[1]}) = <b>${ans}</b>.`,
    answer: ans,
  }
}

export function generateProbQuestion(enabled: ProbType[]): ProbQuestion {
  const t = enabled.length ? pick(enabled) : 'ev'
  switch (t) {
    case 'ev':
      return buildEv(rint(3, 8), rint(10, 40), pick([0.1, 0.2, 0.25, 0.5]), rint(1, 3))
    case 'comp':
      return buildComp(rint(2, 4), rint(1, 6))
    case 'binom': {
      const n = rint(3, 5)
      return buildBinom(n, rint(1, n - 1), pick([0.5, 1 / 3, 0.25, 0.2, 0.6]))
    }
    case 'bayes':
      return buildBayes(pick([1, 2, 5]), pick([90, 95, 80]))
    case 'cond':
      return buildCond(rint(3, 6), rint(2, 5))
    case 'lin':
      return buildLin(pick([10, 12, 20, 30, 60]), pick<[number, number]>([[1, 6], [1, 2], [1, 3], [2, 6]]))
    case 'geo':
      return buildGeoQ(pick<[number, number]>([[1, 2], [1, 6], [1, 4], [1, 3]]))
  }
}
