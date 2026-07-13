/** Random integer in [a, b], inclusive on both ends. */
export const rint = (a: number, b: number): number =>
  Math.floor(Math.random() * (b - a + 1)) + a

/** Uniform random element of a non-empty array. */
export const pick = <T>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)]

/** In-place Fisher–Yates shuffle; returns the same array. */
export const shuffle = <T>(arr: T[]): T[] => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
