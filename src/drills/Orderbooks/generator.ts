import { pick, rint, shuffle } from '../../lib/random'

/**
 * Orderbooks — find a set of buy/sell trades across cards that locks in a
 * risk-free profit, or recognise there's none and skip.
 *
 * A card is a tradeable with a buy price (you pay to buy) and a sell price
 * (you receive to sell); sell < buy on every card. Each card delivers a
 * `composition` of underlying assets — a plain item is 1 unit of one asset,
 * a bundle is a combination with quantities (the circled count in the sketch).
 *
 * A position is legal (a "closed"/hedged position) when the net quantity of
 * every underlying asset is zero. Its cash is +sell for each card you sell and
 * −buy for each card you buy. An arbitrage is a hedged position with cash > 0.
 * Because boards are small we brute-force every combination in {buy,sell,none}
 * to find the best achievable cash — this grades the player and validates the
 * generator, so the math can't drift.
 */

export interface Asset {
  id: string
  name: string
  icon: string
}

export interface CompUnit {
  asset: string // Asset.id
  qty: number
}

export interface Card {
  id: string
  name: string
  icon: string
  isBundle: boolean
  composition: CompUnit[]
  buy: number // ask — you pay this to buy the card
  sell: number // bid — you receive this to sell the card
}

export type Side = 'buy' | 'sell' | 'none'
export type Positions = Record<string, Side>

export type Scenario = 'components-bundle' | 'crossed-items' | 'multi-bundle'

export interface OrderbookData {
  assets: Asset[]
  cards: Card[]
  scenario: Scenario
  /** Whether a profitable arbitrage exists, from brute force. */
  hasArb: boolean
  /** Best achievable cash (0 when the right move is to skip). */
  best: number
  /** One optimal position (empty = skip). */
  bestPositions: Positions
}

export interface ObResult {
  /** Net asset exposure is zero (a closed position, or an empty skip). */
  hedged: boolean
  /** The player selected at least one side. */
  anyPos: boolean
  /** Cash of the player's position. */
  cash: number
  /** Best achievable cash on this board. */
  best: number
  /** Matched the best (including correctly skipping a no-arb board). */
  solved: boolean
}

/* ---------- pure evaluation ---------- */

export function netExposure(cards: Card[], positions: Positions): Record<string, number> {
  const exp: Record<string, number> = {}
  for (const c of cards) {
    const side = positions[c.id]
    if (side !== 'buy' && side !== 'sell') continue
    const sign = side === 'buy' ? 1 : -1 // buy → you hold +composition, sell → you owe it
    for (const { asset, qty } of c.composition) exp[asset] = (exp[asset] ?? 0) + sign * qty
  }
  return exp
}

export function cashFlow(cards: Card[], positions: Positions): number {
  let cash = 0
  for (const c of cards) {
    if (positions[c.id] === 'buy') cash -= c.buy
    else if (positions[c.id] === 'sell') cash += c.sell
  }
  return cash
}

export const isHedged = (exp: Record<string, number>): boolean =>
  Object.values(exp).every((v) => v === 0)

const emptyPositions = (cards: Card[]): Positions =>
  Object.fromEntries(cards.map((c) => [c.id, 'none'])) as Positions

/** Brute-force the highest-cash hedged position (skip = cash 0 baseline). */
export function bestArbitrage(cards: Card[]): { positions: Positions; cash: number } {
  const sides: Side[] = ['none', 'buy', 'sell']
  const n = cards.length
  const total = 3 ** n
  let best = { positions: emptyPositions(cards), cash: 0 }
  for (let mask = 0; mask < total; mask++) {
    let m = mask
    const pos: Positions = {}
    for (let i = 0; i < n; i++) {
      pos[cards[i].id] = sides[m % 3]
      m = Math.floor(m / 3)
    }
    if (!isHedged(netExposure(cards, pos))) continue
    const cash = cashFlow(cards, pos)
    if (cash > best.cash) best = { positions: pos, cash }
  }
  return best
}

export function evaluateBoard(data: OrderbookData, positions: Positions): ObResult {
  const hedged = isHedged(netExposure(data.cards, positions))
  const anyPos = data.cards.some((c) => positions[c.id] === 'buy' || positions[c.id] === 'sell')
  const cash = cashFlow(data.cards, positions)
  const solved = hedged && cash === data.best
  return { hedged, anyPos, cash, best: data.best, solved }
}

/* ---------- generation ---------- */

const ASSET_POOL: Omit<Asset, 'id'>[] = [
  { name: 'Coil', icon: '🌀' },
  { name: 'Oil barrel', icon: '🛢️' },
  { name: 'Iron ingot', icon: '🔩' },
  { name: 'Bag of flour', icon: '🌾' },
  { name: 'Timber', icon: '🪵' },
  { name: 'Copper wire', icon: '🟠' },
  { name: 'Salt', icon: '🧂' },
]
const BUNDLE_NAMES = ['Crate', 'Kit', 'Pallet', 'Bundle', 'Lot']
const BUNDLE_ICON = '🪣'

let cardSeq = 0
const nextId = () => `c${cardSeq++}`

const fairOf = (comp: CompUnit[], values: Record<string, number>): number =>
  comp.reduce((s, { asset, qty }) => s + qty * values[asset], 0)

/** Price a card symmetrically around its fair value (no-arb baseline). */
function priced(
  partial: Omit<Card, 'buy' | 'sell'>,
  fair: number,
  half: number,
): Card {
  const sell = Math.max(1, fair - half)
  return { ...partial, buy: sell + 2 * half, sell }
}

function itemCard(asset: Asset): Omit<Card, 'buy' | 'sell'> {
  return {
    id: nextId(),
    name: asset.name,
    icon: asset.icon,
    isBundle: false,
    composition: [{ asset: asset.id, qty: 1 }],
  }
}

function bundleCard(comp: CompUnit[]): Omit<Card, 'buy' | 'sell'> {
  return {
    id: nextId(),
    name: pick(BUNDLE_NAMES),
    icon: BUNDLE_ICON,
    isBundle: true,
    composition: comp,
  }
}

function pickAssets(n: number): Asset[] {
  return shuffle([...ASSET_POOL])
    .slice(0, n)
    .map((a, i) => ({ ...a, id: `a${i}` }))
}

function buildComponentsBundle(): OrderbookData {
  const nComp = rint(2, 3)
  const assets = pickAssets(nComp)
  const values = Object.fromEntries(assets.map((a) => [a.id, rint(4, 12)]))
  const components = assets.map((a) => priced(itemCard(a), values[a.id], rint(1, 2)))
  const comp: CompUnit[] = assets.map((a) => ({ asset: a.id, qty: rint(1, 2) }))
  let bundle = priced(bundleCard(comp), fairOf(comp, values), rint(1, 2))

  const componentsAsk = components.reduce((s, c) => s + c.buy, 0)
  const componentsBid = components.reduce((s, c) => s + c.sell, 0)
  const roll = Math.random()
  if (roll < 0.34) {
    // build & sell: bundle bid above the cost to buy the parts
    const sell = componentsAsk + rint(2, 5)
    bundle = { ...bundle, sell, buy: sell + rint(1, 3) }
  } else if (roll < 0.68) {
    // buy & break: bundle ask below what the parts sell for
    const buy = Math.max(2, componentsBid - rint(2, 5))
    bundle = { ...bundle, buy, sell: Math.max(1, buy - rint(1, 3)) }
  }
  return finalize([...components, bundle], assets, 'components-bundle')
}

function buildCrossedItems(): OrderbookData {
  const assets = pickAssets(rint(2, 3))
  const [hot, ...rest] = assets
  const values = Object.fromEntries(assets.map((a) => [a.id, rint(5, 12)]))
  // two venues for the same asset, plus distractor items (can't be hedged alone)
  const a = priced(itemCard(hot), values[hot.id], rint(1, 2))
  let b = priced(itemCard(hot), values[hot.id], rint(1, 2))
  b = { ...b, name: hot.name } // same asset, second venue
  const distractors = rest.map((asset) => priced(itemCard(asset), values[asset.id], rint(1, 2)))

  if (Math.random() < 0.6) {
    // cross the market: venue A's bid sits above venue B's ask → buy B, sell A
    const bBuy = rint(4, 9)
    const aSell = bBuy + rint(2, 5)
    const withCross = { ...a, sell: aSell, buy: aSell + rint(1, 3) }
    const bCrossed = { ...b, buy: bBuy, sell: Math.max(1, bBuy - rint(1, 3)) }
    return finalize(shuffle([withCross, bCrossed, ...distractors]), assets, 'crossed-items')
  }
  return finalize(shuffle([a, b, ...distractors]), assets, 'crossed-items')
}

function buildMultiBundle(): OrderbookData {
  const assets = pickAssets(2)
  const values = Object.fromEntries(assets.map((a) => [a.id, rint(4, 10)]))
  const components = assets.map((a) => priced(itemCard(a), values[a.id], rint(1, 2)))
  const comp1: CompUnit[] = [
    { asset: assets[0].id, qty: 1 },
    { asset: assets[1].id, qty: 1 },
  ]
  const comp2: CompUnit[] = [
    { asset: assets[0].id, qty: 2 },
    { asset: assets[1].id, qty: 1 },
  ]
  let b1 = priced(bundleCard(comp1), fairOf(comp1, values), rint(1, 2))
  const b2 = priced(bundleCard(comp2), fairOf(comp2, values), rint(1, 2))
  if (Math.random() < 0.6) {
    // misprice bundle 1's bid above the cost to assemble it from parts
    const cost = components.reduce(
      (s, c, i) => s + (comp1.some((u) => u.asset === assets[i].id) ? c.buy : 0),
      0,
    )
    const sell = cost + rint(2, 4)
    b1 = { ...b1, sell, buy: sell + rint(1, 3) }
  }
  return finalize(shuffle([...components, b1, b2]), assets, 'multi-bundle')
}

/** Attach the brute-forced best; callers regenerate degenerate boards. */
function finalize(cards: Card[], assets: Asset[], scenario: Scenario): OrderbookData {
  const { positions, cash } = bestArbitrage(cards)
  return {
    assets,
    cards,
    scenario,
    hasArb: cash > 0,
    best: cash,
    bestPositions: positions,
  }
}

const BUILDERS = [buildComponentsBundle, buildCrossedItems, buildMultiBundle]

export function generateOrderbook(): OrderbookData {
  // regenerate the rare degenerate board (every price ≥ 1, sell < buy, and an
  // arb that isn't absurdly large so it stays a mental-math puzzle)
  for (let attempt = 0; attempt < 60; attempt++) {
    const data = pick(BUILDERS)()
    const pricesOk = data.cards.every((c) => c.sell >= 1 && c.buy > c.sell)
    if (pricesOk && data.best <= 12) return data
  }
  return buildComponentsBundle()
}
