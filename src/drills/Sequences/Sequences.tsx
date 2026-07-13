import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import {
  generateSequenceQuestion,
  SEQUENCE_TYPES,
  type SequenceQuestion,
  type SequenceType,
} from './generator'
import { normFrac } from '../../lib/fraction'
import { recordAttempt } from '../../lib/stats'
import { ChipGroup } from '../../components/ChipGroup'
import { Stat } from '../../components/Stat'
import { Fraction } from '../../components/Fraction'

const SEP = '  '

export default function Sequences({ active }: { active: boolean }) {
  const [enabled, setEnabled] = useState<Set<SequenceType>>(
    () => new Set(SEQUENCE_TYPES.map((t) => t.id)),
  )
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  const [q, setQ] = useState<SequenceQuestion>(() => generateSequenceQuestion([...enabled]))
  const [input, setInput] = useState('')
  const [result, setResult] = useState<'open' | 'right' | 'wrong' | 'skipped'>('open')
  const [score, setScore] = useState(0)
  const [seen, setSeen] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const next = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    setQ(generateSequenceQuestion([...enabledRef.current]))
    setInput('')
    setResult('open')
    inputRef.current?.focus()
  }, [])

  const scheduleNext = (ms: number) => {
    timerRef.current = setTimeout(next, ms)
  }

  const submit = () => {
    if (result !== 'open') {
      next()
      return
    }
    const ok = normFrac(input) === normFrac(q.answer)
    setSeen((s) => s + 1)
    if (ok) setScore((s) => s + 1)
    setResult(ok ? 'right' : 'wrong')
    recordAttempt('sequences', q.type, ok)
    scheduleNext(ok ? 700 : 2600)
  }

  const skip = () => {
    if (result !== 'open') return
    setSeen((s) => s + 1)
    setResult('skipped')
    recordAttempt('sequences', q.type, false)
    scheduleNext(2200)
  }

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  useEffect(() => {
    if (active) inputRef.current?.focus()
  }, [active])

  return (
    <section className={'panel' + (active ? ' active' : '')} aria-hidden={!active}>
      <div className="panel-head">
        <div className="panel-title">Sequences</div>
        <div className="stats">
          <Stat value={score} label="correct" />
          <Stat value={seen} label="seen" />
        </div>
      </div>
      <div className="panel-sub">
        Find the next term. Includes fraction sequences — track numerator and denominator as two
        separate sequences. Type an integer or a fraction like{' '}
        <span className="kbd-inline">3/4</span>.
      </div>

      <div className="controls" style={{ marginBottom: 16 }}>
        <ChipGroup
          options={SEQUENCE_TYPES}
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
          <button type="button" className="btn ghost" onClick={skip} disabled={result !== 'open'}>
            Skip
          </button>
        </div>
        {result === 'right' && (
          <div className="feedback ok" role="status">
            <b className="tag tag-ok">correct</b> — {q.rule}.
          </div>
        )}
        {(result === 'wrong' || result === 'skipped') && (
          <div className="feedback no" role="status">
            <b className="tag tag-no">answer: {q.answer}</b>
            <div className="work">{q.rule}.</div>
          </div>
        )}
      </div>
    </section>
  )
}
