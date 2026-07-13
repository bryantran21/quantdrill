/**
 * localStorage-backed history so accuracy trends survive reloads.
 * Attempts are per-question drills (sequences, odds, orderbooks);
 * runs are the timed drills (zap, arithmetic) scored per 30s/120s run.
 */

export interface Attempt {
  drill: string
  qtype: string
  ok: boolean
  t: number // epoch ms
}

export interface Run {
  mode: string
  score: number
  t: number // epoch ms
}

const ATTEMPTS_KEY = 'qd-attempts'
const RUNS_KEY = 'qd-runs'
const CAP = 5000

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function save<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items.slice(-CAP)))
  } catch {
    // storage full or unavailable — stats are best-effort
  }
}

export function recordAttempt(drill: string, qtype: string, ok: boolean): void {
  const items = load<Attempt>(ATTEMPTS_KEY)
  items.push({ drill, qtype, ok, t: Date.now() })
  save(ATTEMPTS_KEY, items)
}

export function recordRun(mode: string, score: number): void {
  const items = load<Run>(RUNS_KEY)
  items.push({ mode, score, t: Date.now() })
  save(RUNS_KEY, items)
}

export const getAttempts = (): Attempt[] => load<Attempt>(ATTEMPTS_KEY)
export const getRuns = (): Run[] => load<Run>(RUNS_KEY)

export function clearHistory(): void {
  try {
    localStorage.removeItem(ATTEMPTS_KEY)
    localStorage.removeItem(RUNS_KEY)
  } catch {
    // ignore
  }
}
