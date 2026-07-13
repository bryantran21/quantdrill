import { Fragment, useEffect, useRef, useState } from 'react'
import {
  generateSequenceQuestion,
  SEQUENCE_TYPES,
  type SequenceQuestion,
  type SequenceType,
} from './generator'
import { normFrac } from '../../lib/fraction'
import { bestRun, recordAttempt, recordRun } from '../../lib/stats'
import { useRecordOnFinish, useTimedSession } from '../../session/useTimedSession'
import { ChipGroup } from '../../components/ChipGroup'
import { Stat } from '../../components/Stat'
import { Fraction } from '../../components/Fraction'
import { DurationSelect } from '../../components/DurationSelect'
import { Landing } from '../../components/Landing'
import { Scorecard } from '../../components/Scorecard'
import { RunBar } from '../../components/RunBar'

const DURATIONS = [60, 120, 180]
const SEP = '  '
const MODE = 'sequences'

export default function Sequences({ active }: { active: boolean }) {
  const s = useTimedSession()
  const [duration, setDuration] = useState(120)
  const [enabled, setEnabled] = useState<Set<SequenceType>>(
    () => new Set(SEQUENCE_TYPES.map((t) => t.id)),
  )
  const [q, setQ] = useState<SequenceQuestion | null>(null)
  const [input, setInput] = useState('')
  const [result, setResult] = useState<'open' | 'right' | 'wrong'>('open')
  const [score, setScore] = useState(0)
  const [seen, setSeen] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useRecordOnFinish(s.phase, () => recordRun(MODE, score))

  const nextQuestion = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    advanceTimer.current = null
    setQ(generateSequenceQuestion([...enabled]))
    setInput('')
    setResult('open')
    inputRef.current?.focus()
  }

  const start = () => {
    setScore(0)
    setSeen(0)
    setInput('')
    setResult('open')
    setQ(generateSequenceQuestion([...enabled]))
    s.start(duration)
  }

  const submit = () => {
    if (s.phase !== 'running' || !q) return
    if (result !== 'open') {
      nextQuestion()
      return
    }
    const ok = normFrac(input) === normFrac(q.answer)
    setSeen((n) => n + 1)
    recordAttempt(MODE, q.type, ok)
    if (ok) {
      setScore((n) => n + 1)
      setResult('right')
      advanceTimer.current = setTimeout(nextQuestion, 450)
    } else {
      // wrong: show the answer, wait for Enter / Next so the rule sinks in
      setResult('wrong')
    }
  }

  const toggle = (id: SequenceType) =>
    setEnabled((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  useEffect(() => {
    if (s.phase === 'running') inputRef.current?.focus()
  }, [s.phase])

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
  }, [])

  return (
    <section className={'panel' + (active ? ' active' : '')} aria-hidden={!active}>
      <div className="panel-head">
        <div className="panel-title">Sequences</div>
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
        Find the next term. Includes fraction sequences — track numerator and denominator as two
        separate sequences. Type an integer or a fraction like{' '}
        <span className="kbd-inline">3/4</span>.
      </div>

      {s.phase === 'idle' && (
        <Landing onStart={start} startLabel="Start" disabled={enabled.size === 0}>
          <ChipGroup options={SEQUENCE_TYPES} active={enabled} onToggle={toggle} />
          <DurationSelect value={duration} options={DURATIONS} onChange={setDuration} />
          {enabled.size === 0 && <div className="landing-hint">Enable at least one type.</div>}
        </Landing>
      )}

      {s.phase === 'running' && q && (
        <div className="card">
          <div className="prompt">
            <span className="seq">
              {q.terms.map((t, i) => (
                <Fragment key={i}>
                  {t.kind === 'int' ? t.text : <Fraction n={t.n} d={t.d} />}
                  {q.type === 'frac' ? SEP : `,${SEP}`}
                </Fragment>
              ))}
              <span className="qmark">?</span>
            </span>
          </div>
          <div className="answer-row">
            <input
              ref={inputRef}
              type="text"
              className={result === 'right' ? 'right' : result === 'wrong' ? 'wrong' : ''}
              placeholder="next term"
              autoComplete="off"
              aria-label="Next term"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
            />
            <button type="button" className="btn" onClick={submit}>
              {result === 'open' ? 'Check' : 'Next'}
            </button>
          </div>
          <RunBar frac={s.timeLeft / s.duration} />
          {result === 'wrong' && (
            <div className="feedback no" role="status">
              <b className="tag tag-no">answer: {q.answer}</b>
              <div className="work">{q.rule}.</div>
            </div>
          )}
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
