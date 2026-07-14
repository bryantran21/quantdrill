import { useState } from 'react'
import { generateLikelihoodQuestion, type LikelihoodQuestion } from './generator'
import { bestRun, recordAttempt, recordRun } from '../../lib/stats'
import { useRecordOnFinish, useTimedSession } from '../../session/useTimedSession'
import { Stat } from '../../components/Stat'
import { Feedback } from '../../components/Feedback'
import { DurationSelect } from '../../components/DurationSelect'
import { Landing } from '../../components/Landing'
import { Scorecard } from '../../components/Scorecard'
import { RunBar } from '../../components/RunBar'

const DURATIONS = [120, 180, 300]
const MODE = 'likelihood'

export default function Likelihood({ active }: { active: boolean }) {
  const s = useTimedSession()
  const [duration, setDuration] = useState(180)
  const [q, setQ] = useState<LikelihoodQuestion>(generateLikelihoodQuestion)
  const [picked, setPicked] = useState<string[]>([])
  const [result, setResult] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [seen, setSeen] = useState(0)

  useRecordOnFinish(s.phase, () => recordRun(MODE, score))

  const newQuestion = () => {
    setQ(generateLikelihoodQuestion())
    setPicked([])
    setResult(null)
  }

  const start = () => {
    setScore(0)
    setSeen(0)
    newQuestion()
    s.start(duration)
  }

  const toggle = (id: string) => {
    if (result !== null) return
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  const submit = () => {
    if (result !== null || picked.length !== q.outcomes.length) return
    const ok = picked.every((id, i) => id === q.correctOrder[i])
    setResult(ok)
    setSeen((n) => n + 1)
    if (ok) setScore((n) => n + 1)
    recordAttempt(MODE, q.type, ok)
  }

  const labelOf = (id: string) => q.outcomes.find((o) => o.id === id)?.label ?? id
  const correctText = q.correctOrder.map((id, i) => `${i + 1}. ${labelOf(id)}`).join(' &nbsp; ')

  return (
    <section className={'panel' + (active ? ' active' : '')} aria-hidden={!active}>
      <div className="panel-head">
        <div className="panel-title">Likelihood-list</div>
        <div className="stats">
          <Stat value={score} label="correct" />
          <Stat value={seen} label="seen" />
          {s.phase === 'running' && (
            <Stat
              value={Math.max(0, Math.ceil(s.timeLeft))}
              label="seconds"
              tone={s.timeLeft <= 15 ? 'crit' : s.timeLeft <= 45 ? 'low' : undefined}
            />
          )}
        </div>
      </div>
      <div className="panel-sub">
        Rank the outcomes from <b>most</b> to <b>least</b> likely. Click them in order — the number
        shows the rank you've assigned. Click again to unset.
      </div>

      {s.phase === 'idle' && (
        <Landing onStart={start} startLabel="Start">
          <div className="landing-hint">
            Answer as many as you can. Order every outcome, most likely first, then submit.
          </div>
          <DurationSelect value={duration} options={DURATIONS} onChange={setDuration} />
        </Landing>
      )}

      {s.phase === 'running' && (
        <div className="card">
          <div className="prompt" style={{ marginBottom: 18 }}>
            {q.prompt}
          </div>
          <div className="rank-list">
            {q.outcomes.map((o) => {
              const rank = picked.indexOf(o.id)
              const isPicked = rank >= 0
              const correctRank = result !== null ? q.correctOrder.indexOf(o.id) : -1
              return (
                <button
                  key={o.id}
                  type="button"
                  disabled={result !== null}
                  className={'rank-item' + (isPicked ? ' on' : '')}
                  onClick={() => toggle(o.id)}
                >
                  <span className="rank-badge">{isPicked ? rank + 1 : ''}</span>
                  <span className="rank-label">{o.label}</span>
                  {result !== null && (
                    <span className="rank-correct">should be #{correctRank + 1}</span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="controls" style={{ marginTop: 16 }}>
            {result === null ? (
              <>
                <button
                  type="button"
                  className="btn"
                  disabled={picked.length !== q.outcomes.length}
                  onClick={submit}
                >
                  Submit ranking
                </button>
                {picked.length > 0 && (
                  <button type="button" className="btn ghost" onClick={() => setPicked([])}>
                    Clear
                  </button>
                )}
              </>
            ) : (
              <button type="button" className="btn" onClick={newQuestion}>
                Next →
              </button>
            )}
          </div>

          {result !== null && (
            <Feedback
              ok={result}
              tag={result ? 'correct' : 'not quite'}
              workHtml={`Most → least likely: ${correctText}<div class="work">${q.explanation}</div>`}
            />
          )}

          <div style={{ marginTop: 16 }}>
            <RunBar frac={s.timeLeft / s.duration} />
          </div>
        </div>
      )}

      {s.phase === 'done' && (
        <Scorecard
          headline={score}
          headlineUnit="correct"
          lines={[
            { label: 'seen', value: seen },
            { label: 'accuracy', value: seen ? `${Math.round((score / seen) * 100)}%` : '—' },
            { label: 'best', value: Math.max(bestRun(MODE), score) },
          ]}
          onAgain={start}
          onSettings={s.reset}
        />
      )}
    </section>
  )
}
