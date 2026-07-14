import { useEffect, useRef, useState } from 'react'
import { generateZapQuestion, type ZapBox, type ZapQuestion } from './generator'
import { bestRun, recordRun } from '../../lib/stats'
import { useRecordOnFinish, useTimedSession } from '../../session/useTimedSession'
import { Stat } from '../../components/Stat'
import { DurationSelect } from '../../components/DurationSelect'
import { Landing } from '../../components/Landing'
import { Scorecard } from '../../components/Scorecard'
import { RunBar } from '../../components/RunBar'

const DURATIONS = [60, 90, 120]
const MODE = 'zap'

function Box({ box, active, label }: { box: ZapBox; active: boolean; label: string }) {
  return (
    <div className={'zap-box' + (active ? ' active' : '')}>
      <div className="zap-box-label">{label}</div>
      <div className="zap-box-body">
        <div className="zap-box-eq">
          {box.a} {box.op} {box.b}
        </div>
        <div className="zap-box-arrows">
          <div className="arrows a">{box.rowA.join(' ')}</div>
          <div className="arrows b">{box.rowB.join(' ')}</div>
        </div>
      </div>
    </div>
  )
}

export default function Zap({ active }: { active: boolean }) {
  const s = useTimedSession()
  const [duration, setDuration] = useState(120)
  const [q, setQ] = useState<ZapQuestion | null>(null)
  const [score, setScore] = useState(0)
  const [seen, setSeen] = useState(0)
  const [flash, setFlash] = useState<{ yes: boolean; ok: boolean } | null>(null)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useRecordOnFinish(s.phase, () => recordRun(MODE, score))

  const start = () => {
    setScore(0)
    setSeen(0)
    setQ(generateZapQuestion())
    s.start(duration)
  }

  const answer = (yes: boolean) => {
    if (s.phase !== 'running' || !q) return
    const ok = yes === q.answerYes
    setFlash({ yes, ok })
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlash(null), 120)
    setSeen((n) => n + 1)
    if (ok) setScore((n) => n + 1)
    setQ(generateZapQuestion()) // both boxes and the active one refresh each answer
  }
  const answerRef = useRef(answer)
  answerRef.current = answer

  useEffect(() => {
    if (s.phase !== 'running') return
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
  }, [s.phase])

  useEffect(() => () => {
    if (flashTimer.current) clearTimeout(flashTimer.current)
  }, [])

  return (
    <section className={'panel' + (active ? ' active' : '')} aria-hidden={!active}>
      <div className="panel-head">
        <div className="panel-title">Zap</div>
        <div className="stats">
          <Stat value={score} label="correct" />
          <Stat value={seen} label="seen" />
          {s.phase === 'running' && (
            <Stat
              value={Math.max(0, Math.ceil(s.timeLeft))}
              label="seconds"
              tone={s.timeLeft <= 5 ? 'crit' : s.timeLeft <= 12 ? 'low' : undefined}
            />
          )}
        </div>
      </div>
      <div className="panel-sub">
        Two boxes, each with an equation and two arrow rows. Answer the <b>highlighted</b> one:
        the <b>top</b> box asks <b>is the result odd?</b>, the <b>bottom</b> box asks <b>do the
        arrows match?</b> The active box switches each round. ← Yes / → No.
      </div>

      {s.phase === 'idle' && (
        <Landing onStart={start} startLabel={`Start ${duration}s run`}>
          <DurationSelect value={duration} options={DURATIONS} onChange={setDuration} />
        </Landing>
      )}

      {s.phase === 'running' && q && (
        <div className="card">
          <div className="zap-stack">
            <Box box={q.top} active={q.active === 'top'} label="Top — result odd?" />
            <Box box={q.bottom} active={q.active === 'bottom'} label="Bottom — arrows match?" />
          </div>
          <RunBar frac={s.timeLeft / s.duration} />
          <div className="zap-btns">
            <button
              type="button"
              className={'zap-btn' + (flash?.yes ? (flash.ok ? ' flash-ok' : ' flash-no') : '')}
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
