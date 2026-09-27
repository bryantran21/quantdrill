import type { DrillId } from '../tabs'

/**
 * Firm → drill mapping for the "Prep by firm" directory.
 *
 * Only Optiver's online assessment has a well-documented public structure; the
 * rest are focus areas drawn from publicly shared candidate reports, which vary
 * by role and change over time. Keep the wording hedged and list rounds this app
 * doesn't cover (usually coding) in `alsoExpect` rather than implying full coverage.
 */
export interface Firm {
  id: string
  name: string
  /** One-line, hedged summary of what the firm's assessments lean on. */
  focus: string
  /** Drills that train those skills, most relevant first. */
  drills: DrillId[]
  /** True when our drills mirror a documented OA section-for-section. */
  documented?: boolean
  /** Rounds candidates report that this app does not cover. */
  alsoExpect?: string
}

export const FIRMS: Firm[] = [
  {
    id: 'optiver',
    name: 'Optiver',
    focus:
      'Online assessment in six sections: probability, number logic, likelihood ranking, estimation intervals, orderbook arbitrage, and Zap-N reflex games.',
    drills: ['prob', 'seq', 'like', 'intv', 'ob', 'zap'],
    documented: true,
  },
  {
    id: 'jane-street',
    name: 'Jane Street',
    focus: 'Known for probability, expected value, estimation, and mental math, often framed as trading games.',
    drills: ['prob', 'intv', 'arith', 'ob'],
    alsoExpect: 'live market-making games in interviews',
  },
  {
    id: 'citadel',
    name: 'Citadel / Citadel Securities',
    focus: 'Trading and quant assessments lean on probability, fast mental math, and sequence questions.',
    drills: ['prob', 'arith', 'seq'],
    alsoExpect: 'coding rounds for quant and SWE roles',
  },
  {
    id: 'two-sigma',
    name: 'Two Sigma',
    focus: 'Quant roles emphasise probability, statistics, and quantitative reasoning.',
    drills: ['prob', 'seq', 'intv'],
    alsoExpect: 'coding and statistics interviews',
  },
  {
    id: 'hrt',
    name: 'Hudson River Trading',
    focus: 'Probability, mental math, and logical reasoning, alongside strong coding.',
    drills: ['prob', 'arith', 'seq'],
    alsoExpect: 'coding-heavy technical rounds',
  },
  {
    id: 'jump',
    name: 'Jump Trading',
    focus: 'Probability, mental math, and trading intuition.',
    drills: ['prob', 'arith', 'ob'],
    alsoExpect: 'market-making and trading interviews',
  },
  {
    id: 'de-shaw',
    name: 'D. E. Shaw',
    focus: 'Quantitative aptitude: probability, sequences, and mental math.',
    drills: ['prob', 'seq', 'arith'],
    alsoExpect: 'coding rounds for technical roles',
  },
  {
    id: 'sig',
    name: 'SIG',
    focus: 'Heavy on probability, expected value, and decisions under uncertainty.',
    drills: ['prob', 'like', 'arith'],
    alsoExpect: 'poker and game-theory style questions',
  },
  {
    id: 'imc',
    name: 'IMC',
    focus: 'Known for a fast timed numerical test, plus sequences and probability.',
    drills: ['arith', 'seq', 'prob'],
  },
  {
    id: 'akuna',
    name: 'Akuna Capital',
    focus: 'Mental math, probability, sequences, and market intuition.',
    drills: ['arith', 'prob', 'seq', 'ob'],
    alsoExpect: 'options-pricing questions',
  },
  {
    id: 'virtu',
    name: 'Virtu',
    focus: 'Mental math and numerical reasoning.',
    drills: ['arith', 'seq', 'prob'],
  },
]
