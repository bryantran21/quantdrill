import { useEffect, useRef, useState } from 'react'
import { generateZapQuestion, ZAP_MODES, type ZapMode, type ZapQuestion } from './generator'
import { recordRun } from '../../lib/stats'
import { ChipGroup } from '../../components/ChipGroup'
import { Stat } from '../../components/Stat'

const RUN_SECONDS = 30

export default function Zap({ active }: { active: boolean }) {
  const [mode, setMode] = useState<ZapMode>('parity')
  const [running, setRunning] = useState(false)
  const [q, setQ] = useState<ZapQuestion | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [time, setTime] = useState(RUN_SECONDS)
  const [lastScore, setLastScore] = useState<number | null>(null)
  const [flash, setFlash] = useState<{ yes: boolean; ok: boolean } | null>(null)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const start = () => {
    setScore(0)
    setStreak(0)
    setTime(RUN_SECONDS)
    setQ(generateZapQuestion(mode))
    setRunning(true)
  }

  const answer = (yes: boolean) => {
    if (!running || !q) return
    const ok = yes === q.answerYes
    setFlash({ yes, ok })
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlash(null), 120)
    if (ok) {
      setScore((s) => s + 1)
      setStreak((s) => s + 1)
    } else {
      setStreak(0)
    }
    setQ(generateZapQuestion(mode))
  }
  const answerRef = useRef(answer)
  answerRef.current = answer

  // 100ms tick drives both the countdown number and the run bar
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setTime((t) => t - 0.1), 100)
    return () => clearInterval(id)
  }, [running])

  useEffect(() => {
    if (running && time <= 0) {
      setRunning(false)
      setQ(null)
      setLastScore(score)
      recordRun(`zap-${mode}`, score)
    }
  }, [time, running, score, mode])

  // ← Yes / → No, only while a run is live
  useEffect(() => {
    if (!running) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        answerRef.current(true)
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        answerRef.current(false)
      }
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [running])

  useEffect(() => () => {
    if (flashTimer.current) clearTimeout(flashTimer.current)
  }, [])

  const instr =
    mode === 'parity' ? (
      <>
        An equation appears. Is the <b>result odd</b>? &nbsp;←&nbsp;Yes&nbsp;/&nbsp;→&nbsp;No
      </>
    ) : (
      <>
        Two arrow rows appear. Do they <b>match exactly</b>? &nbsp;←&nbsp;Yes&nbsp;/&nbsp;→&nbsp;No
      </>
    )

  return (
    <section className={'panel' + (active ? ' active' : '')} aria-hidden={!active}>
      <div className="panel-head">
        <div className="panel-title">Zap</div>
        <div className="stats">
          <Stat value={score} label="correct" />
          <Stat value={streak} label="streak" />
          <Stat
            value={Math.max(0, Math.ceil(time))}
            label="seconds"
            tone={running && time <= 5 ? 'crit' : running && time <= 12 ? 'low' : undefined}
          />
        </div>
      </div>
      <div className="panel-sub">
        Two reflex games, 30-second runs. Speed and accuracy both count — answer with the keyboard.
      </div>

      <div className="controls" style={{ marginBottom: 16 }}>
        <ChipGroup
          options={ZAP_MODES}
          active={new Set([mode])}
          onToggle={(id) => setMode(id)}
        />
      </div>

      <div className="card">
        {running && q ? (
          <div>
            {q.mode === 'parity' ? (
              <div className="zap-eq">
                {q.a} {q.op} {q.b}
              </div>
            ) : (
              <>
                <div className="arrows a">{q.rowA.join(' ')}</div>
                <div className="arrows b">{q.rowB.join(' ')}</div>
              </>
            )}
            <div className="runbar">
              <div style={{ width: `${(Math.max(0, time) / RUN_SECONDS) * 100}%` }} />
            </div>
            <div className="zap-btns">
              <button
                type="button"
                className={
                  'zap-btn' + (flash?.yes ? (flash.ok ? ' flash-ok' : ' flash-no') : '')
                }
                onClick={() => answer(true)}
              >
                Yes<span className="kbd">← left arrow</span>
              </button>
              <button
                type="button"
                className={
                  'zap-btn' + (flash && !flash.yes ? (flash.ok ? ' flash-ok' : ' flash-no') : '')
                }
                onClick={() => answer(false)}
              >
                No<span className="kbd">→ right arrow</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="zap-start">
            <div className="instr">
              {lastScore !== null ? (
                <>
                  Run over — <b>{lastScore} correct</b>
                  {lastScore >= 25 ? ' 🔥 sharp' : ''}. Go again?
                </>
              ) : (
                instr
              )}
            </div>
            <button type="button" className="btn" onClick={start}>
              Start 30s run
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
