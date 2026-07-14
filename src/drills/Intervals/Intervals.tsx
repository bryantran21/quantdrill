import { useEffect, useRef, useState } from 'react'
import {
  generateIntervalQuestion,
  scoreInterval,
  type IntervalQuestion,
  type IntervalScore,
} from './generator'
import { bestRun, recordAttempt, recordRun } from '../../lib/stats'
import { useRecordOnFinish, useTimedSession } from '../../session/useTimedSession'
import { Stat } from '../../components/Stat'
import { Feedback } from '../../components/Feedback'
import { DurationSelect } from '../../components/DurationSelect'
import { Landing } from '../../components/Landing'
import { Scorecard } from '../../components/Scorecard'
import { RunBar } from '../../components/RunBar'

const DURATIONS = [120, 180, 300]
const MODE = 'intervals'

export default function Intervals({ active }: { active: boolean }) {
  const s = useTimedSession()
  const [duration, setDuration] = useState(180)
  const [q, setQ] = useState<IntervalQuestion>(generateIntervalQuestion)
  const [lower, setLower] = useState('')
  const [upper, setUpper] = useState('')
  const [result, setResult] = useState<IntervalScore | null>(null)
  const [points, setPoints] = useState(0)
  const [seen, setSeen] = useState(0)
  const lowerRef = useRef<HTMLInputElement>(null)

  useRecordOnFinish(s.phase, () => recordRun(MODE, points))

  const newQuestion = () => {
    setQ(generateIntervalQuestion())
    setLower('')
    setUpper('')
    setResult(null)
  }

  const start = () => {
    setPoints(0)
    setSeen(0)
    newQuestion()
    s.start(duration)
  }

  const lo = Number(lower)
  const hi = Number(upper)
  const valid = lower !== '' && upper !== '' && Number.isFinite(lo) && Number.isFinite(hi) && lo <= hi

  const submit = () => {
    if (result !== null || !valid) return
    const r = scoreInterval(q.answer, lo, hi)
    setResult(r)
    setPoints((p) => p + r.points)
    setSeen((n) => n + 1)
    recordAttempt(MODE, q.type, r.points > 0)
  }

  useEffect(() => {
    if (s.phase === 'running' && result === null) lowerRef.current?.focus()
  }, [s.phase, q, result])

  return (
    <section className={'panel' + (active ? ' active' : '')} aria-hidden={!active}>
      <div className="panel-head">
        <div className="panel-title">Intervals</div>
        <div className="stats">
          <Stat value={points} label="points" />
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
        Estimate the value and bracket it with a <b>lower</b> and <b>upper</b> bound. You score only
        if the true answer lands inside — and a tighter interval scores more (up to 10). Wild guesses
        that always contain it earn almost nothing.
      </div>

      {s.phase === 'idle' && (
        <Landing onStart={start} startLabel="Start">
          <div className="landing-hint">
            Answer as many as you can. Points reward calibration: right and tight beats right and
            wide; a miss scores zero.
          </div>
          <DurationSelect value={duration} options={DURATIONS} onChange={setDuration} />
        </Landing>
      )}

      {s.phase === 'running' && (
        <div className="card">
          <div className="interval-q">{q.prompt}</div>
          <div className="interval-inputs">
            <label className="interval-field">
              <span>lower</span>
              <input
                ref={lowerRef}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className={result ? (result.hit ? 'right' : 'wrong') : ''}
                value={lower}
                onChange={(e) => setLower(e.target.value.replace(/[^\d.]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && (result ? newQuestion() : submit())}
                disabled={result !== null}
              />
            </label>
            <span className="interval-dash">–</span>
            <label className="interval-field">
              <span>upper</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className={result ? (result.hit ? 'right' : 'wrong') : ''}
                value={upper}
                onChange={(e) => setUpper(e.target.value.replace(/[^\d.]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && (result ? newQuestion() : submit())}
                disabled={result !== null}
              />
            </label>
          </div>

          <div className="controls" style={{ marginTop: 4 }}>
            {result === null ? (
              <button type="button" className="btn" disabled={!valid} onClick={submit}>
                Submit
              </button>
            ) : (
              <button type="button" className="btn" onClick={newQuestion}>
                Next → <span className="kbd-inline">enter</span>
              </button>
            )}
          </div>

          {result !== null && (
            <Feedback
              ok={result.points > 0}
              tag={result.hit ? `+${result.points} pts` : 'missed'}
              workHtml={
                `Answer: <b>${q.answer}</b>. ` +
                (result.hit
                  ? `Your interval was ${Math.round(result.relWidth * 100)}% of the answer wide — ${
                      result.points >= 8 ? 'tight!' : result.points >= 4 ? 'decent.' : 'a bit wide.'
                    }`
                  : 'Outside your bracket — no points.')
              }
            />
          )}

          <div style={{ marginTop: 16 }}>
            <RunBar frac={s.timeLeft / s.duration} />
          </div>
        </div>
      )}

      {s.phase === 'done' && (
        <Scorecard
          headline={points}
          headlineUnit="points"
          lines={[
            { label: 'seen', value: seen },
            { label: 'avg', value: seen ? (points / seen).toFixed(1) : '—' },
            { label: 'best', value: Math.max(bestRun(MODE), points) },
          ]}
          onAgain={start}
          onSettings={s.reset}
        />
      )}
    </section>
  )
}
