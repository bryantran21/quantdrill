import { useEffect, useState } from 'react'
import {
  generateProbQuestion,
  PROB_TYPES,
  type ProbQuestion,
  type ProbType,
} from './generator'
import { bestRun, recordAttempt, recordRun } from '../../lib/stats'
import { useRecordOnFinish, useTimedSession } from '../../session/useTimedSession'
import { ChipGroup } from '../../components/ChipGroup'
import { Stat } from '../../components/Stat'
import { Feedback } from '../../components/Feedback'
import { DurationSelect } from '../../components/DurationSelect'
import { Landing } from '../../components/Landing'
import { Scorecard } from '../../components/Scorecard'
import { RunBar } from '../../components/RunBar'

const DURATIONS = [60, 120, 180]
const MODE = 'beat-the-odds'

export default function BeatTheOdds({ active }: { active: boolean }) {
  const s = useTimedSession()
  const [duration, setDuration] = useState(120)
  const [enabled, setEnabled] = useState<Set<ProbType>>(
    () => new Set(PROB_TYPES.map((t) => t.id)),
  )
  const [q, setQ] = useState<ProbQuestion | null>(null)
  const [picked, setPicked] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [seen, setSeen] = useState(0)

  useRecordOnFinish(s.phase, () => recordRun(MODE, score))

  const start = () => {
    setScore(0)
    setSeen(0)
    setPicked(null)
    setAnswered(false)
    setQ(generateProbQuestion([...enabled]))
    s.start(duration)
  }

  const reveal = (i: number) => {
    if (answered || s.phase !== 'running') return
    setAnswered(true)
    setPicked(i)
    const ok = q!.options[i].correct
    setSeen((n) => n + 1)
    if (ok) setScore((n) => n + 1)
    recordAttempt(MODE, q!.type, ok)
  }

  const next = () => {
    setAnswered(false)
    setPicked(null)
    setQ(generateProbQuestion([...enabled]))
  }

  const toggle = (id: ProbType) =>
    setEnabled((prev) => {
      const nxt = new Set(prev)
      if (nxt.has(id)) nxt.delete(id)
      else nxt.add(id)
      return nxt
    })

  // Enter / Space advances to the next question once answered
  useEffect(() => {
    if (s.phase !== 'running' || !answered) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        next()
      }
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.phase, answered])

  const ok = picked !== null && q !== null && q.options[picked].correct

  return (
    <section className={'panel' + (active ? ' active' : '')} aria-hidden={!active}>
      <div className="panel-head">
        <div className="panel-title">Beat the Odds</div>
        <div className="stats">
          <Stat value={score} label="correct" />
          <Stat value={seen} label="seen" />
          {s.phase === 'running' && (
            <Stat
              value={Math.max(0, Math.ceil(s.timeLeft))}
              label="seconds"
              tone={s.timeLeft <= 10 ? 'crit' : s.timeLeft <= 25 ? 'low' : undefined}
            />
          )}
        </div>
      </div>
      <div className="panel-sub">
        Multiple choice against the clock — answer as many as you can. Answers are often the
        nearest option, so get close enough to pick.
      </div>

      {s.phase === 'idle' && (
        <Landing onStart={start} startLabel="Start" disabled={enabled.size === 0}>
          <ChipGroup options={PROB_TYPES} active={enabled} onToggle={toggle} />
          <DurationSelect value={duration} options={DURATIONS} onChange={setDuration} />
          {enabled.size === 0 && <div className="landing-hint">Enable at least one type.</div>}
        </Landing>
      )}

      {s.phase === 'running' && q && (
        <div className="card">
          {/* generator-authored markup only (<b>, <sup>) — never user input */}
          <div className="prompt" dangerouslySetInnerHTML={{ __html: q.prompt }} />
          <div className="opts">
            {q.options.map((o, i) => (
              <button
                key={`${o.label}-${i}`}
                type="button"
                disabled={answered}
                className={
                  'opt' +
                  (answered && o.correct ? ' correct' : '') +
                  (answered && picked === i && !o.correct ? ' wrong' : '')
                }
                onClick={() => reveal(i)}
              >
                <span className="letter">{'abcd'[i]}</span>
                {o.label}
              </button>
            ))}
          </div>
          {answered && (
            <Feedback
              ok={ok}
              tag={ok ? 'correct' : 'not quite'}
              workHtml={q.work}
            />
          )}
          {answered && (
            <div className="controls" style={{ marginTop: 16 }}>
              <button type="button" className="btn ghost" onClick={next}>
                Next → <span className="kbd-inline">enter</span>
              </button>
            </div>
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
