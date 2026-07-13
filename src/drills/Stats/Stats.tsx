import { useEffect, useState } from 'react'
import {
  clearHistory,
  getAttempts,
  getRuns,
  type Attempt,
  type Run,
} from '../../lib/stats'

interface TypeAgg {
  drill: string
  qtype: string
  seen: number
  correct: number
}

interface RunAgg {
  mode: string
  runs: number
  best: number
  last: number
}

function aggregateAttempts(attempts: Attempt[]): TypeAgg[] {
  const map = new Map<string, TypeAgg>()
  for (const a of attempts) {
    const key = `${a.drill}/${a.qtype}`
    const agg = map.get(key) ?? { drill: a.drill, qtype: a.qtype, seen: 0, correct: 0 }
    agg.seen++
    if (a.ok) agg.correct++
    map.set(key, agg)
  }
  return [...map.values()].sort(
    (a, b) => a.drill.localeCompare(b.drill) || a.qtype.localeCompare(b.qtype),
  )
}

function aggregateRuns(runs: Run[]): RunAgg[] {
  const map = new Map<string, RunAgg>()
  for (const r of runs) {
    const agg = map.get(r.mode) ?? { mode: r.mode, runs: 0, best: 0, last: 0 }
    agg.runs++
    agg.best = Math.max(agg.best, r.score)
    agg.last = r.score
    map.set(r.mode, agg)
  }
  return [...map.values()].sort((a, b) => a.mode.localeCompare(b.mode))
}

export default function Stats({ active }: { active: boolean }) {
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [runs, setRuns] = useState<Run[]>([])

  // refresh from localStorage every time the panel is opened
  useEffect(() => {
    if (active) {
      setAttempts(getAttempts())
      setRuns(getRuns())
    }
  }, [active])

  const clear = () => {
    if (window.confirm('Clear all saved history? This cannot be undone.')) {
      clearHistory()
      setAttempts([])
      setRuns([])
    }
  }

  const byType = aggregateAttempts(attempts)
  const byRun = aggregateRuns(runs)

  return (
    <section className={'panel' + (active ? ' active' : '')} aria-hidden={!active}>
      <div className="panel-head">
        <div className="panel-title">Stats</div>
      </div>
      <div className="panel-sub">
        Accuracy by drill and question type, saved locally in your browser. Use it to find the
        question types that need more reps.
      </div>

      <div className="card">
        {byType.length === 0 ? (
          <div className="hint" style={{ marginTop: 0 }}>
            No attempts recorded yet — go answer some questions.
          </div>
        ) : (
          <table className="stats-table">
            <thead>
              <tr>
                <th>Drill</th>
                <th>Type</th>
                <th className="num">Seen</th>
                <th className="num">Correct</th>
                <th className="num">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {byType.map((r) => (
                <tr key={`${r.drill}/${r.qtype}`}>
                  <td className="drill-name">{r.drill}</td>
                  <td>{r.qtype}</td>
                  <td className="num">{r.seen}</td>
                  <td className="num">{r.correct}</td>
                  <td className="num">{Math.round((r.correct / r.seen) * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        {byRun.length === 0 ? (
          <div className="hint" style={{ marginTop: 0 }}>
            No timed runs recorded yet — try Zap or Arithmetic.
          </div>
        ) : (
          <table className="stats-table">
            <thead>
              <tr>
                <th>Timed drill</th>
                <th className="num">Runs</th>
                <th className="num">Best</th>
                <th className="num">Last</th>
              </tr>
            </thead>
            <tbody>
              {byRun.map((r) => (
                <tr key={r.mode}>
                  <td className="drill-name">{r.mode}</td>
                  <td className="num">{r.runs}</td>
                  <td className="num">{r.best}</td>
                  <td className="num">{r.last}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(attempts.length > 0 || runs.length > 0) && (
        <div className="controls">
          <button type="button" className="btn ghost" onClick={clear}>
            Clear history
          </button>
        </div>
      )}
    </section>
  )
}
