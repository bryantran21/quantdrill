import { useEffect, useRef, useState } from 'react'
import { generateArithmeticQuestion, type ArithmeticQuestion } from './generator'
import { recordRun } from '../../lib/stats'
import { Stat } from '../../components/Stat'

const RUN_SECONDS = 120

export default function Arithmetic({ active }: { active: boolean }) {
  const [running, setRunning] = useState(false)
  const [q, setQ] = useState<ArithmeticQuestion | null>(null)
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(RUN_SECONDS)
  const [lastScore, setLastScore] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const start = () => {
    setScore(0)
    setTime(RUN_SECONDS)
    setInput('')
    setQ(generateArithmeticQuestion())
    setRunning(true)
  }

  // zetamac-style: the answer submits itself the moment it is complete
  const onInput = (raw: string) => {
    const v = raw.replace(/\D/g, '')
    if (q && v !== '' && Number(v) === q.answer) {
      setScore((s) => s + 1)
      setQ(generateArithmeticQuestion())
      setInput('')
      return
    }
    setInput(v)
  }

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setTime((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [running])

  useEffect(() => {
    if (running && time <= 0) {
      setRunning(false)
      setQ(null)
      setLastScore(score)
      recordRun('arithmetic', score)
    }
  }, [time, running, score])

  useEffect(() => {
    if (running) inputRef.current?.focus()
  }, [running, q])

  return (
    <section className={'panel' + (active ? ' active' : '')} aria-hidden={!active}>
      <div className="panel-head">
        <div className="panel-title">Arithmetic</div>
        <div className="stats">
          <Stat value={score} label="solved" />
          <Stat
            value={Math.max(0, time)}
            label="seconds"
            tone={running && time <= 10 ? 'crit' : running && time <= 30 ? 'low' : undefined}
          />
        </div>
      </div>
      <div className="panel-sub">
        Zetamac-style mental math: two minutes, as many as you can. The answer submits itself as
        soon as you type it — no Enter needed.
      </div>

      <div className="card">
        {running && q ? (
          <div>
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
            <div className="runbar" style={{ marginTop: 20 }}>
              <div style={{ width: `${(Math.max(0, time) / RUN_SECONDS) * 100}%` }} />
            </div>
          </div>
        ) : (
          <div className="zap-start">
            <div className="instr">
              {lastScore !== null ? (
                <>
                  Run over — <b>{lastScore} solved</b>
                  {lastScore >= 40 ? ' 🔥 sharp' : ''}. Go again?
                </>
              ) : (
                <>
                  Addition 2–100, multiplication 2–12 × 2–100, subtraction and division as exact
                  inverses.
                </>
              )}
            </div>
            <button type="button" className="btn" onClick={start}>
              Start 2 min run
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
