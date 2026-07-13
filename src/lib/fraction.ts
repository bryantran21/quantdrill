import { gcd } from './math'

/** Reduce n/d to lowest terms. */
export const reduce = (n: number, d: number): [number, number] => {
  const g = gcd(n, d)
  return [n / g, d / g]
}

/** Canonical string for n/d in lowest terms; plain integer when d divides n. */
export function fracStr(n: number, d: number): string {
  const [a, b] = reduce(n, d)
  return b === 1 ? String(a) : `${a}/${b}`
}

/**
 * Normalize user input — "a/b" or a bare integer — to the same canonical
 * form fracStr produces, so answers compare as strings.
 */
export function normFrac(s: string): string {
  s = s.trim().replace(/\s/g, '')
  if (s.includes('/')) {
    const [a, b] = s.split('/').map(Number)
    if (!b) return s
    return fracStr(a, b)
  }
  return s
}
