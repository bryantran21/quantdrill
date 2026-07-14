import { pick, rint, shuffle } from '../../lib/random'
import { comb } from '../../lib/math'

/**
 * Likelihood-list — rank a set of outcomes from most to least likely.
 * Each outcome carries a `weight` proportional to its probability; the correct
 * ranking is by weight descending. Generators guarantee distinct weights so the
 * ordering is unambiguous.
 */

export type LikelihoodType = 'dice-sum' | 'bag' | 'coin'

export interface Outcome {
  id: string
  label: string
  weight: number
}

export interface LikelihoodQuestion {
  type: LikelihoodType
  prompt: string
  /** Outcomes in shuffled display order. */
  outcomes: Outcome[]
  /** Outcome ids from most to least likely. */
  correctOrder: string[]
  explanation: string
}

// ways to roll each total on two dice (out of 36)
const DICE_WEIGHT: Record<number, number> = {
  2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1,
}

const COLORS = ['red', 'blue', 'green', 'yellow', 'white', 'black']

/** Assemble a question from labelled weights, ensuring the order is unambiguous. */
function assemble(
  type: LikelihoodType,
  prompt: string,
  items: { label: string; weight: number }[],
  explanation: string,
): LikelihoodQuestion {
  const outcomes: Outcome[] = items.map((it, i) => ({ id: `o${i}`, ...it }))
  const correctOrder = [...outcomes].sort((a, b) => b.weight - a.weight).map((o) => o.id)
  return { type, prompt, outcomes: shuffle([...outcomes]), correctOrder, explanation }
}

function distinctWeights(items: { label: string; weight: number }[]): boolean {
  return new Set(items.map((i) => i.weight)).size === items.length
}

function buildDiceSum(): LikelihoodQuestion | null {
  const totals = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).slice(0, rint(3, 4))
  const items = totals.map((t) => ({ label: `Total of ${t}`, weight: DICE_WEIGHT[t] }))
  if (!distinctWeights(items)) return null
  return assemble(
    'dice-sum',
    'Roll two fair dice. Rank these totals from most to least likely.',
    items,
    'Ways to make each total (out of 36): ' +
      totals
        .slice()
        .sort((a, b) => DICE_WEIGHT[b] - DICE_WEIGHT[a])
        .map((t) => `${t}→${DICE_WEIGHT[t]}`)
        .join(', ') +
      '. Totals near 7 have the most combinations.',
  )
}

function buildBag(): LikelihoodQuestion | null {
  const colors = shuffle([...COLORS]).slice(0, rint(3, 4))
  const counts = shuffle([2, 3, 4, 5, 6, 7, 8]).slice(0, colors.length)
  const items = colors.map((c, i) => ({ label: `a ${c} ball`, weight: counts[i] }))
  if (!distinctWeights(items)) return null
  const total = counts.reduce((s, c) => s + c, 0)
  return assemble(
    'bag',
    `A bag holds ${colors.map((c, i) => `${counts[i]} ${c}`).join(', ')}. You draw one ball at random. Rank the colours from most to least likely.`,
    items,
    `Total ${total} balls, so each colour's chance is its count over ${total}. More balls = more likely.`,
  )
}

function buildCoin(): LikelihoodQuestion | null {
  const n = rint(4, 6)
  const ks = shuffle([...Array(n + 1).keys()]).slice(0, 3)
  const items = ks.map((k) => ({ label: `exactly ${k} heads`, weight: comb(n, k) }))
  if (!distinctWeights(items)) return null
  return assemble(
    'coin',
    `Flip a fair coin ${n} times. Rank these outcomes from most to least likely.`,
    items,
    'Ways to get each count: ' +
      ks
        .slice()
        .sort((a, b) => comb(n, b) - comb(n, a))
        .map((k) => `${k} heads → C(${n},${k})=${comb(n, k)}`)
        .join(', ') +
      `. All share the same ${2 ** n} equally-likely flip sequences.`,
  )
}

const BUILDERS = [buildDiceSum, buildBag, buildCoin]

export function generateLikelihoodQuestion(): LikelihoodQuestion {
  for (let i = 0; i < 40; i++) {
    const q = pick(BUILDERS)()
    if (q) return q
  }
  // fallback that always has distinct weights
  return assemble(
    'bag',
    'A bag holds 2 red, 4 blue, 6 green. You draw one ball at random. Rank the colours from most to least likely.',
    [
      { label: 'a green ball', weight: 6 },
      { label: 'a blue ball', weight: 4 },
      { label: 'a red ball', weight: 2 },
    ],
    'Total 12 balls; more balls = more likely.',
  )
}
