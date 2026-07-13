/** Greatest common divisor; returns 1 for gcd(0, 0) so it is always safe as a divisor. */
export const gcd = (a: number, b: number): number => {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) {
    ;[a, b] = [b, a % b]
  }
  return a || 1
}

/** Binomial coefficient C(n, k). */
export function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0
  k = Math.min(k, n - k)
  let r = 1
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1)
  return Math.round(r)
}

/** Round to d decimal places (default 2). */
export const round = (x: number, d = 2): number => {
  const p = 10 ** d
  return Math.round(x * p) / p
}
