import { useEffect, useRef, useState } from 'react'
import {
  generateProbQuestion,
  PROB_TYPES,
  type ProbQuestion,
  type ProbType,
} from './generator'
import { recordAttempt } from '../../lib/stats'
import { ChipGroup } from '../../components/ChipGroup'
import { Stat } from '../../components/Stat'
import { Feedback } from '../../components/Feedback'

const TIME_LIMIT = 90

export default function BeatTheOdds({ active }: { active: boolean }) {
  const [enabled, setEnabled] = useState<Set<ProbType>>(
    () => new Set(PROB_TYPES.map((t) => t.id)),
  )
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  const [q, setQ] = useState<ProbQuestion>(() => generateProbQuestion([...enabled]))
  const [picked, setPicked] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [time, setTime] = useState(TIME_LIMIT)
  const [score, setScore] = useState(0)
  const [seen, setSeen] = useState(0)
  const answeredRef = useRef(false)

  const reveal = (i: number | null) => {
    if (answeredRef.current) return
    answeredRef.current = true
    setAnswered(true)
    setPicked(i)
    const ok = i !== null && q.options[i].correct
    setSeen((s) => s + 1)
    if (ok) setScore((s) => s + 1)
    recordAttempt('beat-the-odds', q.type, ok)
  }

  const next = () => {
    answeredRef.current = false
    setAnswered(false)
    setPicked(null)
    setTime(TIME_LIMIT)
    setQ(generateProbQuestion([...enabledRef.current]))
  }

  useEffect(() => {
    if (answered) return
    const id = setInterval(() => setTime((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [q, answered])

  useEffect(() => {
    if (time <= 0) reveal(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time])

  const ok = picked !== null && q.options[picked].correct

  return (
    <section className={'panel' + (active ? ' active' : '')} aria-hidden={!active}>
      <div className="panel-head">
        <div className="panel-title">Beat the Odds</div>
        <div className="stats">
          <Stat value={score} label="correct" />
          <Stat value={seen} label="seen" />
          <Stat
            value={Math.max(0, time)}
            label="seconds"
            tone={time <= 10 ? 'crit' : time <= 25 ? 'low' : undefined}
          />
        </div>
      </div>
      <div className="panel-sub">
        Multiple choice, 90 seconds each. Answers are often the nearest option — get close enough
        to pick, you rarely need an exact decimal.
      </div>

      <div className="controls" style={{ marginBottom: 16 }}>
        <ChipGroup
          options={PROB_TYPES}
          active={enabled}
          onToggle={(id) =>
            setEnabled((prev) => {
              const s = new Set(prev)
              if (s.has(id)) s.delete(id)
              else s.add(id)
              return s
            })
          }
        />
      </div>

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
            tag={ok ? 'correct' : picked !== null ? 'not quite' : 'time up'}
            workHtml={q.work}
          />
        )}
      </div>
      {answered && (
        <div className="controls">
          <button type="button" className="btn ghost" onClick={next}>
            Next →
          </button>
        </div>
      )}
    </section>
  )
}
