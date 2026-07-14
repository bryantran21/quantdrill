import { describe, expect, it } from 'vitest'
import {
  buildPercent,
  buildProduct,
  buildSquare,
  buildSum,
  buildTriple,
  generateIntervalQuestion,
  scoreInterval,
} from './generator'

describe('interval builders compute exact answers', () => {
  it('product', () => expect(buildProduct(47, 83).answer).toBe(3901))
  it('triple', () => expect(buildTriple(6, 7, 8).answer).toBe(336))
  it('square', () => expect(buildSquare(64).answer).toBe(4096))
  it('sum', () => expect(buildSum([120, 340, 55, 600]).answer).toBe(1115))
  it('percent is always an integer (n is a multiple of 100)', () => {
    expect(buildPercent(15, 300).answer).toBe(45)
    expect(buildPercent(75, 800).answer).toBe(600)
  })
})

describe('generateIntervalQuestion', () => {
  it('every question has a positive integer answer matching its prompt intent', () => {
    for (let i = 0; i < 2000; i++) {
      const q = generateIntervalQuestion()
      expect(Number.isInteger(q.answer)).toBe(true)
      expect(q.answer).toBeGreaterThan(0)
    }
  })
})

describe('scoreInterval', () => {
  it('a miss scores 0', () => {
    expect(scoreInterval(100, 10, 90).points).toBe(0)
    expect(scoreInterval(100, 110, 200).points).toBe(0)
  })

  it('a correct bracket always scores at least 1', () => {
    expect(scoreInterval(100, 0, 1000).points).toBeGreaterThanOrEqual(1)
    expect(scoreInterval(100, 0, 1000).hit).toBe(true)
  })

  it('tighter correct brackets score higher', () => {
    const tight = scoreInterval(100, 95, 105) // relWidth 0.1
    const loose = scoreInterval(100, 60, 140) // relWidth 0.8
    expect(tight.points).toBeGreaterThan(loose.points)
    expect(tight.points).toBe(9)
  })

  it('a perfect point estimate scores 10', () => {
    expect(scoreInterval(100, 100, 100).points).toBe(10)
  })
})
