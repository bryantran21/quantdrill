import { useEffect, useRef, useState } from 'react'
import {
  DEFAULT_ARITH_CONFIG,
  generateArithmeticQuestion,
  type ArithConfig,
  type ArithmeticQuestion,
  type ArithOp,
  type Range,
} from './generator'
import { bestRun, recordRun } from '../../lib/stats'
import { useRecordOnFinish, useTimedSession } from '../../session/useTimedSession'
import { Stat } from '../../components/Stat'
import { DurationSelect } from '../../components/DurationSelect'
import { Landing } from '../../components/Landing'
import { Scorecard } from '../../components/Scorecard'
import { RunBar } from '../../components/RunBar'

const DURATIONS = [60, 120, 300]
const MODE = 'arithmetic'

function RangeInputs({
  value,
  onChange,
}: {
  value: Range
  onChange: (r: Range) => void
}) {
  const set = (i: 0 | 1, v: string) => {
    const n = Math.max(0, Math.floor(Number(v) || 0))
    const next: Range = i === 0 ? [n, value[1]] : [value[0], n]
    onChange(next)
  }
  return (
    <span className="range">
      (
      <input
        type="text"
        inputMode="numeric"
        className="num-input"
        aria-label="minimum"
        value={value[0]}
        onChange={(e) => set(0, e.target.value)}
      />
      to
      <input
        type="text"
        inputMode="numeric"
        className="num-input"
        aria-label="maximum"
        value={value[1]}
        onChange={(e) => set(1, e.target.value)}
      />
      )
    </span>
  )
}

export default function Arithmetic({ active }: { active: boolean }) {
  const s = useTimedSession()
  const [duration, setDuration] = useState(120)
  const [cfg, setCfg] = useState<ArithConfig>(DEFAULT_ARITH_CONFIG)
  const [q, setQ] = useState<ArithmeticQuestion | null>(null)
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useRecordOnFinish(s.phase, () => recordRun(MODE, score))

  const toggleOp = (op: ArithOp) =>
    setCfg((c) => ({ ...c, ops: { ...c.ops, [op]: !c.ops[op] } }))
  const anyOp = Object.values(cfg.ops).some(Boolean)

  const start = () => {
    setScore(0)
    setInput('')
    setQ(generateArithmeticQuestion(cfg))
    s.start(duration)
  }

  // zetamac-style: the answer submits itself the moment it is complete
  const onInput = (raw: string) => {
    const v = raw.replace(/\D/g, '')
    if (q && v !== '' && Number(v) === q.answer) {
      setScore((n) => n + 1)
      setQ(generateArithmeticQuestion(cfg))
      setInput('')
      return
    }
    setInput(v)
  }

  useEffect(() => {
    if (s.phase === 'running') inputRef.current?.focus()
  }, [s.phase, q])

  return (
    <section className={'panel' + (active ? ' active' : '')} aria-hidden={!active}>
      <div className="panel-head">
        <div className="panel-title">Arithmetic</div>
        <div className="stats">
          <Stat value={score} label="solved" />
          {s.phase === 'running' && (
            <Stat
              value={Math.max(0, Math.ceil(s.timeLeft))}
              label="seconds"
              tone={s.timeLeft <= 10 ? 'crit' : s.timeLeft <= 30 ? 'low' : undefined}
            />
          )}
        </div>
      </div>
      <div className="panel-sub">
        Zetamac-style mental math. Set the ranges, pick a duration, and solve as many as you can.
        The answer submits itself as soon as you type it — no Enter needed.
      </div>

      {s.phase === 'idle' && (
        <Landing onStart={start} startLabel="Start" disabled={!anyOp}>
          <div className="config-form">
            <div className="op-row">
              <label className="op-name">
                <input
                  type="checkbox"
                  checked={cfg.ops.add}
                  onChange={() => toggleOp('add')}
                />
                Addition
              </label>
              <RangeInputs value={cfg.addA} onChange={(r) => setCfg((c) => ({ ...c, addA: r }))} />
              <span className="op-note">+</span>
              <RangeInputs value={cfg.addB} onChange={(r) => setCfg((c) => ({ ...c, addB: r }))} />
            </div>

            <div className="op-row">
              <label className="op-name">
                <input
                  type="checkbox"
                  checked={cfg.ops.sub}
                  onChange={() => toggleOp('sub')}
                />
                Subtraction
              </label>
              <span className="op-note">addition problems in reverse</span>
            </div>

            <div className="op-row">
              <label className="op-name">
                <input
                  type="checkbox"
                  checked={cfg.ops.mul}
                  onChange={() => toggleOp('mul')}
                />
                Multiplication
              </label>
              <RangeInputs value={cfg.mulA} onChange={(r) => setCfg((c) => ({ ...c, mulA: r }))} />
              <span className="op-note">×</span>
              <RangeInputs value={cfg.mulB} onChange={(r) => setCfg((c) => ({ ...c, mulB: r }))} />
            </div>

            <div className="op-row">
              <label className="op-name">
                <input
                  type="checkbox"
                  checked={cfg.ops.div}
                  onChange={() => toggleOp('div')}
                />
                Division
              </label>
              <span className="op-note">multiplication problems in reverse</span>
            </div>
          </div>
          <DurationSelect value={duration} options={DURATIONS} onChange={setDuration} />
          {!anyOp && <div className="landing-hint">Enable at least one operation.</div>}
        </Landing>
      )}

      {s.phase === 'running' && q && (
        <div className="card">
          <div className="zap-eq">{q.text}</div>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            className="arith-input"
            aria-label="Answer"
            autoComplete="off"
            value={input}
            onChange={(e) => onInput(e.target.value)}
          />
          <RunBar frac={s.timeLeft / s.duration} />
        </div>
      )}

      {s.phase === 'done' && (
        <Scorecard
          headline={score}
          headlineUnit="solved"
          lines={[
            { label: 'per min', value: duration ? Math.round((score / duration) * 60) : 0 },
            { label: 'best', value: Math.max(bestRun(MODE), score) },
          ]}
          onAgain={start}
          onSettings={s.reset}
        />
      )}
    </section>
  )
}
