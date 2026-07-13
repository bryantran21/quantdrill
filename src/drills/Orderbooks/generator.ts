import { pick, rint, shuffle } from '../../lib/random'

/**
 * Orderbooks — find a set of buy/sell trades across cards that locks in a
 * risk-free profit, or recognise there's none and skip.
 *
 * A card is a tradeable with a buy price (you pay to buy) and a sell price
 * (you receive to sell); sell < buy on every card. Each card delivers a
 * `composition` of underlying assets — a plain item is 1 unit of one asset,
 * a bundle is a combination with quantities.
 *
 * A position assigns each card an integer quantity (positive = bought,
 * negative = sold); you can trade a card more than once, which is what lets
 * you hedge a bundle that holds several of an item. A position is legal (a
 * "closed"/hedged position) when the net quantity of every underlying asset
 * is zero. Its cash is +sell per unit sold and −buy per unit bought. Because
 * boards are small we brute-force every quantity in [−K, K] per card (K = the
 * largest quantity that appears in any bundle, so you can hedge exactly once
 * but not scale the edge infinitely). This grades the player and validates the
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
  buy: number // ask — you pay this per unit bought
  sell: number // bid — you receive this per unit sold
}

/** card id → net quantity (positive bought, negative sold, 0/absent = none). */
export type Positions = Record<string, number>

export type Scenario = 'components-bundle' | 'crossed-items' | 'multi-bundle'

export interface OrderbookData {
  assets: Asset[]
  cards: Card[]
  scenario: Scenario
  /** Max units tradeable per card (also the UI clamp). */
  maxUnits: number
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
  /** The player traded at least one unit. */
  anyPos: boolean
  /** Cash of the player's position. */
  cash: number
  /** Best achievable cash on this board. */
  best: number
  /** Matched the best (including correctly skipping a no-arb board). */
  solved: boolean
}

/* ---------- pure evaluation ---------- */

export const maxQty = (cards: Card[]): number =>
  Math.max(1, ...cards.flatMap((c) => c.composition.map((u) => u.qty)))

export function netExposure(cards: Card[], positions: Positions): Record<string, number> {
  const exp: Record<string, number> = {}
  for (const c of cards) {
    const q = positions[c.id] ?? 0
    if (q === 0) continue
    for (const { asset, qty } of c.composition) exp[asset] = (exp[asset] ?? 0) + q * qty
  }
  return exp
}

export function cashFlow(cards: Card[], positions: Positions): number {
  let cash = 0
  for (const c of cards) {
    const q = positions[c.id] ?? 0
    if (q > 0) cash -= q * c.buy
    else if (q < 0) cash += -q * c.sell
  }
  return cash
}

export const isHedged = (exp: Record<string, number>): boolean =>
  Object.values(exp).every((v) => v === 0)

/** Brute-force the highest-cash hedged position (skip = cash 0 baseline). */
export function bestArbitrage(cards: Card[]): { positions: Positions; cash: number } {
  const k = maxQty(cards)
  const base = 2 * k + 1
  const n = cards.length
  const total = base ** n
  let best = { positions: {} as Positions, cash: 0 }
  for (let mask = 0; mask < total; mask++) {
    let m = mask
    const pos: Positions = {}
    for (let i = 0; i < n; i++) {
      pos[cards[i].id] = (m % base) - k
      m = Math.floor(m / base)
    }
    if (!isHedged(netExposure(cards, pos))) continue
    const cash = cashFlow(cards, pos)
    if (cash > best.cash) best = { positions: pos, cash }
  }
  return best
}

export function evaluateBoard(data: OrderbookData, positions: Positions): ObResult {
  const hedged = isHedged(netExposure(data.cards, positions))
  const anyPos = data.cards.some((c) => (positions[c.id] ?? 0) !== 0)
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

let cardSeq = 0
const nextId = () => `c${cardSeq++}`

const fairOf = (comp: CompUnit[], values: Record<string, number>): number =>
  comp.reduce((s, { asset, qty }) => s + qty * values[asset], 0)

/** Price a card symmetrically around its fair value (no-arb baseline). */
function priced(partial: Omit<Card, 'buy' | 'sell'>, fair: number, half: number): Card {
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

function bundleCard(comp: CompUnit[], name = pick(BUNDLE_NAMES)): Omit<Card, 'buy' | 'sell'> {
  return {
    id: nextId(),
    name,
    icon: '', // the component emojis are composed at render time
    isBundle: true,
    composition: comp,
  }
}

function pickAssets(n: number): Asset[] {
  return shuffle([...ASSET_POOL])
    .slice(0, n)
    .map((a, i) => ({ ...a, id: `a${i}` }))
}

/** Cost to buy one bundle from its component cards, weighted by quantity. */
const buildCost = (comp: CompUnit[], byAsset: Record<string, Card>): number =>
  comp.reduce((s, u) => s + u.qty * byAsset[u.asset].buy, 0)
const breakValue = (comp: CompUnit[], byAsset: Record<string, Card>): number =>
  comp.reduce((s, u) => s + u.qty * byAsset[u.asset].sell, 0)

function buildComponentsBundle(): OrderbookData {
  const nComp = rint(2, 3)
  const assets = pickAssets(nComp)
  const values = Object.fromEntries(assets.map((a) => [a.id, rint(4, 12)]))
  const components = assets.map((a) => priced(itemCard(a), values[a.id], rint(1, 2)))
  const byAsset = Object.fromEntries(assets.map((a, i) => [a.id, components[i]]))
  const comp: CompUnit[] = assets.map((a) => ({ asset: a.id, qty: rint(1, 2) }))
  let bundle = priced(bundleCard(comp), fairOf(comp, values), rint(1, 2))

  const roll = Math.random()
  if (roll < 0.34) {
    // build & sell: bundle bid above the weighted cost to buy the parts
    const sell = buildCost(comp, byAsset) + rint(2, 5)
    bundle = { ...bundle, sell, buy: sell + rint(1, 3) }
  } else if (roll < 0.68) {
    // buy & break: bundle ask below what the parts sell for
    const buy = Math.max(2, breakValue(comp, byAsset) - rint(2, 5))
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
  const b = { ...priced(itemCard(hot), values[hot.id], rint(1, 2)), name: hot.name }
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
  const byAsset = Object.fromEntries(assets.map((a, i) => [a.id, components[i]]))
  const comp1: CompUnit[] = [
    { asset: assets[0].id, qty: 1 },
    { asset: assets[1].id, qty: 1 },
  ]
  const comp2: CompUnit[] = [
    { asset: assets[0].id, qty: 2 },
    { asset: assets[1].id, qty: 1 },
  ]
  const [name1, name2] = shuffle([...BUNDLE_NAMES]) // distinct names for the two bundles
  let b1 = priced(bundleCard(comp1, name1), fairOf(comp1, values), rint(1, 2))
  const b2 = priced(bundleCard(comp2, name2), fairOf(comp2, values), rint(1, 2))
  if (Math.random() < 0.6) {
    // misprice bundle 1's bid above the weighted cost to assemble it
    const sell = buildCost(comp1, byAsset) + rint(2, 4)
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
    maxUnits: maxQty(cards),
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
    if (pricesOk && data.best <= 14) return data
  }
  return buildComponentsBundle()
}
