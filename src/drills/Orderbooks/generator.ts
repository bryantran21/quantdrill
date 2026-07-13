import { pick, rint, shuffle } from '../../lib/random'

export interface OrderbookRow {
  name: string
  bid: number
  ask: number
}

export type ObScenario = 'buildSell' | 'buyBreak' | 'none'

export interface OrderbookData {
  items: OrderbookRow[]
  bundle: OrderbookRow
  /** Profit of buy-all-parts + sell-bundle (positive means it pays). */
  buildSell: number
  /** Profit of buy-bundle + sell-all-parts (positive means it pays). */
  buyBreak: number
  /** Best available profit; 0 when the right move is to skip. */
  best: number
  scenario: ObScenario
  partsAskSum: number
  partsBidSum: number
}

export type ObAction = 'buy' | 'sell' | 'skip'

export const BUNDLE = 'Bundle'

const NAMES = ['Bolt', 'Gear', 'Chip', 'Coil', 'Rod', 'Cap', 'Disc']

export function generateOrderbook(): OrderbookData {
  const names = shuffle([...NAMES]).slice(0, 3)
  const items = names.map((name) => {
    const mid = rint(3, 12)
    const spread = rint(1, 2)
    return { name, ask: mid + spread, bid: mid - spread } // bid < ask always
  })
  const partsAskSum = items.reduce((s, i) => s + i.ask, 0)
  const partsBidSum = items.reduce((s, i) => s + i.bid, 0)

  // randomly create an arb in one direction, or none (weighted toward none)
  const scenario = pick<ObScenario>(['buildSell', 'buyBreak', 'none', 'none'])
  let bundle: OrderbookRow
  if (scenario === 'buildSell') {
    // bundle bid > partsAskSum → buy parts, sell bundle
    const bid = partsAskSum + rint(1, 4)
    bundle = { name: BUNDLE, ask: bid + rint(1, 3), bid }
  } else if (scenario === 'buyBreak') {
    // bundle ask < partsBidSum → buy bundle, sell parts
    // (clamped so prices stay positive even when parts are cheap)
    const ask = Math.max(2, partsBidSum - rint(1, 4))
    bundle = { name: BUNDLE, ask, bid: Math.max(1, ask - rint(1, 3)) }
  } else {
    // no arb: partsAskSum >= bundle.bid AND bundle.ask >= partsBidSum
    const bid = Math.max(1, partsBidSum - rint(0, 2))
    const ask = partsAskSum + rint(0, 2)
    bundle = { name: BUNDLE, ask: Math.max(ask, bid + 1), bid }
  }

  const buildSell = bundle.bid - partsAskSum
  const buyBreak = partsBidSum - bundle.ask
  const best = Math.max(buildSell, buyBreak, 0)
  return { items, bundle, buildSell, buyBreak, best, scenario, partsAskSum, partsBidSum }
}

export interface ObResult {
  /** Did the user form a closed position (or a clean skip)? */
  valid: boolean
  /** Profit of the user's position; null when the position is invalid. */
  profit: number | null
  /** Whether the user matched the best available move. */
  solved: boolean
  note: string
  /** HTML describing the best available direction and profit. */
  bestLabel: string
}

export function evaluateOrderbook(
  data: OrderbookData,
  actions: Record<string, ObAction>,
): ObResult {
  const { items, bundle, buildSell, buyBreak, best, partsAskSum, partsBidSum } = data
  const bundleAct = actions[BUNDLE]
  const partsActs = items.map((i) => actions[i.name])
  const allPartsBuy = partsActs.every((a) => a === 'buy')
  const allPartsSell = partsActs.every((a) => a === 'sell')
  const allSkip = partsActs.every((a) => a === 'skip') && bundleAct === 'skip'

  let profit: number | null = null
  let valid = true
  let note = ''
  if (allSkip) {
    profit = 0
    note = 'You walked away.'
  } else if (allPartsBuy && bundleAct === 'sell') {
    profit = buildSell
    note = 'Build & sell: bought all parts, sold the bundle.'
  } else if (allPartsSell && bundleAct === 'buy') {
    profit = buyBreak
    note = 'Buy & break: bought the bundle, sold the parts.'
  } else {
    valid = false
    note =
      "That combination isn't a closed position. A clean arbitrage is either buy-all-parts + sell-bundle, or buy-bundle + sell-all-parts (or skip everything)."
  }

  const solved =
    valid && Math.abs((profit || 0) - best) < 0.001 && (best > 0 ? (profit || 0) > 0 : true)

  const bestLabel =
    best > 0
      ? buildSell >= buyBreak
        ? `Buy all parts ($${partsAskSum}) and sell the bundle ($${bundle.bid}) → <b>+$${buildSell}</b>`
        : `Buy the bundle ($${bundle.ask}) and sell the parts ($${partsBidSum}) → <b>+$${buyBreak}</b>`
      : `No arbitrage — both directions lose (build&sell ${buildSell >= 0 ? '+' : ''}$${buildSell}, buy&break ${buyBreak >= 0 ? '+' : ''}$${buyBreak}). <b>Correct move: skip.</b>`

  return { valid, profit, solved, note, bestLabel }
}
