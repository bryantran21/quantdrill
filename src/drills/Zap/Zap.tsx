import { useEffect, useRef, useState } from 'react'
import { generateZapQuestion, type ZapQuestion } from './generator'
import { bestRun, recordRun } from '../../lib/stats'
import { useRecordOnFinish, useTimedSession } from '../../session/useTimedSession'
import { Stat } from '../../components/Stat'
import { DurationSelect } from '../../components/DurationSelect'
import { Landing } from '../../components/Landing'
import { Scorecard } from '../../components/Scorecard'
import { RunBar } from '../../components/RunBar'

const DURATIONS = [60, 90, 120]
const MODE = 'zap'

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
    setQ(generateZapQuestion())
  }
  const answerRef = useRef(answer)
  answerRef.current = answer

  // ← Yes / → No while a run is live
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
        One box, two questions. Each round it asks either <b>ODD?</b> (is the equation's result
        odd?) or <b>MATCH?</b> (do the two arrow rows match?) — the label tells you which. Both a
        number and arrows always show, so watch the label. ← Yes / → No.
      </div>

      {s.phase === 'idle' && (
        <Landing onStart={start} startLabel={`Start ${duration}s run`}>
          <DurationSelect value={duration} options={DURATIONS} onChange={setDuration} />
        </Landing>
      )}

      {s.phase === 'running' && q && (
        <div className="card">
          <div className={'zap-mode ' + q.mode}>{q.mode === 'parity' ? 'Odd?' : 'Match?'}</div>
          <div className={'zap-eq zap-el' + (q.mode === 'parity' ? '' : ' dim')}>
            {q.a} {q.op} {q.b}
          </div>
          <div className={'zap-el' + (q.mode === 'arrows' ? '' : ' dim')}>
            <div className="arrows a">{q.rowA.join(' ')}</div>
            <div className="arrows b">{q.rowB.join(' ')}</div>
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
