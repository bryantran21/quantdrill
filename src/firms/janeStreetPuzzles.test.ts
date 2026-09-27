import { describe, expect, it } from 'vitest'
import { JS_ARCHIVE_URL, JS_PUZZLES } from './janeStreetPuzzles'

describe('JS_PUZZLES', () => {
  it('only links to janestreet.com puzzle pages', () => {
    expect(JS_ARCHIVE_URL.startsWith('https://www.janestreet.com/puzzles/')).toBe(true)
    for (const p of JS_PUZZLES) {
      expect(p.url.startsWith('https://www.janestreet.com/puzzles/')).toBe(true)
      if (p.solutionUrl) expect(p.solutionUrl.startsWith('https://www.janestreet.com/puzzles/')).toBe(true)
    }
  })

  it('has unique titles and urls, each with a short blurb', () => {
    expect(new Set(JS_PUZZLES.map((p) => p.title)).size).toBe(JS_PUZZLES.length)
    expect(new Set(JS_PUZZLES.map((p) => p.url)).size).toBe(JS_PUZZLES.length)
    for (const p of JS_PUZZLES) {
      expect(p.blurb.length).toBeGreaterThan(0)
      expect(p.blurb.length).toBeLessThanOrEqual(120) // a one-line summary, never pasted puzzle text
    }
  })

  it('only the live puzzle lacks a solution link', () => {
    for (const p of JS_PUZZLES) expect(!p.solutionUrl).toBe(p.tag === 'live')
  })
})
