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
  /** 1-3 character monogram shown in the card icon. */
  mono: string
  /** Icon colour hue (0-360); spread with the golden angle so neighbours differ. */
  hue: number
  /**
   * Firm's own site icon in public/logos. 'tile' icons carry their own
   * background and fill the frame; 'mark' icons are bare and get padding.
   * Absent when no square icon reads well at 36px (monogram shown instead).
   */
  logo?: { file: string; fit: 'tile' | 'mark' }
  /** One-line, hedged summary of what the firm's assessments lean on. */
  focus: string
  /** Drills that train those skills, most relevant first. */
  drills: DrillId[]
  /** True when our drills mirror a documented OA section-for-section. */
  documented?: boolean
  /** Rounds candidates report that this app does not cover. */
  alsoExpect?: string
  /** In-page link to extra material for this firm (e.g. a puzzle list). */
  extraLink?: { label: string; href: string }
}

export const FIRMS: Firm[] = [
  {
    id: 'optiver',
    name: 'Optiver',
    mono: 'O',
    hue: 250,
    logo: { file: 'optiver.png', fit: 'mark' },
    focus:
      'Online assessment in six sections: probability, number logic, likelihood ranking, estimation intervals, orderbook arbitrage, and Zap-N reflex games.',
    drills: ['prob', 'seq', 'like', 'intv', 'ob', 'zap'],
    documented: true,
  },
  {
    id: 'jane-street',
    name: 'Jane Street',
    mono: 'JS',
    hue: 28,
    logo: { file: 'jane-street.svg', fit: 'tile' },
    focus: 'Known for probability, expected value, estimation, and mental math, often framed as trading games.',
    drills: ['prob', 'intv', 'arith', 'ob'],
    alsoExpect: 'live market-making games in interviews',
    extraLink: { label: 'Their monthly puzzles ↓', href: '#js-puzzles' },
  },
  {
    id: 'citadel',
    name: 'Citadel / Citadel Securities',
    mono: 'C',
    hue: 165,
    logo: { file: 'citadel.png', fit: 'tile' },
    focus: 'Trading and quant assessments lean on probability, fast mental math, and sequence questions.',
    drills: ['prob', 'arith', 'seq'],
    alsoExpect: 'coding rounds for quant and SWE roles',
  },
  {
    id: 'two-sigma',
    name: 'Two Sigma',
    mono: '2σ',
    hue: 303,
    logo: { file: 'two-sigma.png', fit: 'mark' },
    focus: 'Quant roles emphasise probability, statistics, and quantitative reasoning.',
    drills: ['prob', 'seq', 'intv'],
    alsoExpect: 'coding and statistics interviews',
  },
  {
    id: 'hrt',
    name: 'Hudson River Trading',
    mono: 'HRT',
    hue: 80,
    logo: { file: 'hrt.png', fit: 'tile' },
    focus: 'Probability, mental math, and logical reasoning, alongside strong coding.',
    drills: ['prob', 'arith', 'seq'],
    alsoExpect: 'coding-heavy technical rounds',
  },
  {
    id: 'jump',
    name: 'Jump Trading',
    mono: 'J',
    hue: 218,
    logo: { file: 'jump.png', fit: 'tile' },
    focus: 'Probability, mental math, and trading intuition.',
    drills: ['prob', 'arith', 'ob'],
    alsoExpect: 'market-making and trading interviews',
  },
  {
    id: 'de-shaw',
    name: 'D. E. Shaw',
    mono: 'DE',
    hue: 355,
    focus: 'Quantitative aptitude: probability, sequences, and mental math.',
    drills: ['prob', 'seq', 'arith'],
    alsoExpect: 'coding rounds for technical roles',
  },
  {
    id: 'sig',
    name: 'SIG',
    mono: 'SIG',
    hue: 133,
    logo: { file: 'sig.png', fit: 'tile' },
    focus: 'Heavy on probability, expected value, and decisions under uncertainty.',
    drills: ['prob', 'like', 'arith'],
    alsoExpect: 'poker and game-theory style questions',
  },
  {
    id: 'imc',
    name: 'IMC',
    mono: 'IMC',
    hue: 270,
    logo: { file: 'imc.png', fit: 'mark' },
    focus: 'Known for a fast timed numerical test, plus sequences and probability.',
    drills: ['arith', 'seq', 'prob'],
  },
  {
    id: 'akuna',
    name: 'Akuna Capital',
    mono: 'A',
    hue: 48,
    logo: { file: 'akuna.png', fit: 'tile' },
    focus: 'Mental math, probability, sequences, and market intuition.',
    drills: ['arith', 'prob', 'seq', 'ob'],
    alsoExpect: 'options-pricing questions',
  },
  {
    id: 'virtu',
    name: 'Virtu',
    mono: 'V',
    hue: 185,
    logo: { file: 'virtu.png', fit: 'mark' },
    focus: 'Mental math and numerical reasoning.',
    drills: ['arith', 'seq', 'prob'],
  },
]
