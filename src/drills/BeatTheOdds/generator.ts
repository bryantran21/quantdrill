import { pick, rint, shuffle } from '../../lib/random'
import { comb, harmonic, round } from '../../lib/math'

export type ProbType =
  | 'ev'
  | 'comp'
  | 'binom'
  | 'bayes'
  | 'cond'
  | 'lin'
  | 'geo'
  | 'ruin'
  | 'coupon'
  | 'cards'
  | 'order'
  | 'streak'

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
  { id: 'ruin', label: "gambler's ruin" },
  { id: 'coupon', label: 'coupon collector' },
  { id: 'cards', label: 'cards' },
  { id: 'order', label: 'order stats' },
  { id: 'streak', label: 'streaks' },
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

/** Non-integer count options (e.g. coupon collector), rounded to 1 decimal. */
export function makeApproxOpts(correct: number): ProbOption[] {
  const r1 = (x: number) => round(x, 1)
  const target = r1(correct)
  const set = new Set<number>([target])
  const cands = [r1(correct * 0.7), r1(correct * 1.3), r1(correct + 2), r1(correct - 1.5)]
  for (const c of shuffle(cands)) {
    if (set.size >= 4) break
    if (c > 0) set.add(c)
  }
  let f = 1
  while (set.size < 4) set.add(r1(correct + f++))
  return shuffle([...set]).map((v) => ({ label: String(v), correct: v === target }))
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

export function buildRuin(k: number, N: number): ProbQuestion {
  // fair game → P(reach N before 0) = start / target
  const ans = round(k / N, 2)
  return {
    type: 'ruin',
    prompt: `You have <b>$${k}</b> and bet <b>$1</b> at a time on fair coin flips, stopping when you hit <b>$${N}</b> or go broke. Probability you reach <b>$${N}</b>?`,
    options: makeProbOpts(ans),
    work: `Fair game, so the ruin probability is just start ÷ target = ${k}/${N} = <b>${ans}</b>. No drift means your money is a martingale.`,
    answer: ans,
  }
}

export function buildCoupon(n: number): ProbQuestion {
  // expected draws to collect all n distinct types = n · H_n
  const ans = round(n * harmonic(n), 1)
  return {
    type: 'coupon',
    prompt: `A cereal box holds one of <b>${n}</b> equally likely prizes. Expected number of boxes to collect <b>all ${n}</b>?`,
    options: makeApproxOpts(ans),
    work: `Coupon collector: n·(1 + 1/2 + … + 1/n) = ${n} × ${round(harmonic(n), 2)} = <b>${ans}</b>. Each new prize takes longer as the deck fills up.`,
    answer: ans,
  }
}

export function buildCards(variant: 'same-suit' | 'both-red'): ProbQuestion {
  if (variant === 'same-suit') {
    const ans = round(12 / 51, 2)
    return {
      type: 'cards',
      prompt: `Draw <b>2 cards</b> from a 52-card deck without replacement. Probability the second card is the <b>same suit</b> as the first?`,
      options: makeProbOpts(ans),
      work: `After the first card, 12 of the remaining 51 share its suit → 12/51 = <b>${ans}</b>.`,
      answer: ans,
    }
  }
  const ans = round((26 / 52) * (25 / 51), 2)
  return {
    type: 'cards',
    prompt: `Draw <b>2 cards</b> from a 52-card deck without replacement. Probability <b>both are red</b>?`,
    options: makeProbOpts(ans),
    work: `26/52 × 25/51 = <b>${ans}</b>. The second draw drops both the red count and the total.`,
    answer: ans,
  }
}

export function buildOrder(kind: 'max' | 'min', m: number): ProbQuestion {
  if (kind === 'max') {
    const ans = round((2 * m - 1) / 36, 2)
    return {
      type: 'order',
      prompt: `Roll <b>two dice</b>. Probability the <b>higher</b> of the two equals <b>${m}</b>?`,
      options: makeProbOpts(ans),
      work: `P(max = ${m}) = (2·${m}−1)/36 = ${2 * m - 1}/36 = <b>${ans}</b>. There are ${2 * m - 1} ways for the higher die to be ${m}.`,
      answer: ans,
    }
  }
  const ans = round(((7 - m) / 6) ** 2, 2)
  return {
    type: 'order',
    prompt: `Roll <b>two dice</b>. Probability the <b>lower</b> of the two is <b>at least ${m}</b>?`,
    options: makeProbOpts(ans),
    work: `Both dice ≥ ${m}: ((7−${m})/6)² = (${7 - m}/6)² = <b>${ans}</b>.`,
    answer: ans,
  }
}

export function buildStreak(pattern: 'HH' | 'HT'): ProbQuestion {
  // expected flips to first see the pattern on a fair coin
  const ans = pattern === 'HH' ? 6 : 4
  return {
    type: 'streak',
    prompt: `Flip a fair coin until you first see <b>${pattern}</b> (in a row). Expected number of flips?`,
    options: makeNumOpts(ans),
    work:
      pattern === 'HH'
        ? `Waiting time for HH is <b>6</b>. A broken streak (…H then T) sends you all the way back, so HH is slower than HT.`
        : `Waiting time for HT is <b>4</b>. Once you get a head, every later tail completes it — no costly resets.`,
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
    case 'ruin': {
      const N = pick([5, 10, 20])
      return buildRuin(rint(1, N - 1), N)
    }
    case 'coupon':
      return buildCoupon(pick([3, 4, 5, 6]))
    case 'cards':
      return buildCards(pick(['same-suit', 'both-red']))
    case 'order':
      return buildOrder(pick(['max', 'min']), rint(2, 6))
    case 'streak':
      return buildStreak(pick(['HH', 'HT']))
  }
}
