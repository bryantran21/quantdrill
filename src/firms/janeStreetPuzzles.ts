/**
 * Curated pointers to Jane Street's monthly puzzles. Their puzzles are
 * © Jane Street Group, LLC (all rights reserved), so we only link to them:
 * titles, dates and URLs are facts, and each blurb is our own one-line summary.
 * Never paste their puzzle text or images here.
 *
 * Static list, last checked against https://www.janestreet.com/puzzles/archive/
 * on 2026-09-27. The full-archive link covers anything newer.
 */

export type PuzzleTag = 'live' | 'probability' | 'game theory' | 'grid logic' | 'geometry' | 'mystery'

export interface JsPuzzle {
  title: string
  /** Month the puzzle was posted, e.g. "Aug 2026". */
  date: string
  url: string
  /** Absent for the current (unsolved) puzzle. */
  solutionUrl?: string
  tag: PuzzleTag
  blurb: string
  /** Closest to trading-interview material (probability / game theory). */
  quant?: boolean
}

export const JS_ARCHIVE_URL = 'https://www.janestreet.com/puzzles/archive/'

const base = 'https://www.janestreet.com/puzzles/'

export const JS_PUZZLES: JsPuzzle[] = [
  {
    title: 'Hint Singles',
    date: 'Sep 2026',
    url: `${base}current-puzzle/`,
    tag: 'live',
    blurb: "This month's live puzzle. Submit a correct answer to get on Jane Street's leaderboard.",
  },
  {
    title: "Andy's Afternoon Amble",
    date: 'Aug 2026',
    url: `${base}andys-afternoon-amble-index/`,
    solutionUrl: `${base}andys-afternoon-amble-solution`,
    tag: 'geometry',
    blurb: 'An ant walks across a sphere tiled with hexagons and triangles.',
  },
  {
    title: "'Pent-Up' Frustration 3 / Knight Moves 7",
    date: 'Jul 2026',
    url: `${base}pent-up-frustration-3-knight-moves-7-index/`,
    solutionUrl: `${base}pent-up-frustration-3-knight-moves-7-solution`,
    tag: 'grid logic',
    blurb: 'Stack towers on a pentomino-tiled board, then route a knight through all of it.',
  },
  {
    title: 'Arch Madness',
    date: 'May 2026',
    url: `${base}arch-madness-index/`,
    solutionUrl: `${base}arch-madness-solution`,
    tag: 'grid logic',
    blurb: 'Draw quarter-circle arcs in a grid so every region they carve out has whole-number area.',
  },
  {
    title: 'Can U Dig It?',
    date: 'Apr 2026',
    url: `${base}can-u-dig-it-index/`,
    solutionUrl: `${base}can-u-dig-it-solution`,
    tag: 'mystery',
    blurb: 'No rules given. All you know is that the answer is a positive integer.',
  },
  {
    title: 'Planetary Parade',
    date: 'Mar 2026',
    url: `${base}planetary-parade-index/`,
    solutionUrl: `${base}planetary-parade-solution`,
    tag: 'probability',
    blurb: 'Six planets appear at uniformly random spots in an alien sky: a geometric probability problem.',
    quant: true,
  },
  {
    title: 'Subtiles 2',
    date: 'Feb 2026',
    url: `${base}subtiles-2-index/`,
    solutionUrl: `${base}subtiles-2-solution`,
    tag: 'grid logic',
    blurb: "Fill a grid with one 1, two 2's, three 3's… where each K-shape must contain the (K−1)-shape.",
  },
  {
    title: 'Robot Javelin',
    date: 'Dec 2025',
    url: `${base}robot-javelin-index/`,
    solutionUrl: `${base}robot-javelin-solution`,
    tag: 'game theory',
    blurb: 'Two robots have settled into a Nash equilibrium for their game. Then you learn something new.',
    quant: true,
  },
]
