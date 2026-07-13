import { useEffect, useRef, useState } from 'react'

export type Phase = 'idle' | 'running' | 'done'

export interface TimedSession {
  phase: Phase
  /** Seconds remaining (fractional; tick every `tickMs`). */
  timeLeft: number
  /** Duration of the current run in seconds. */
  duration: number
  start: (durationSec: number) => void
  finish: () => void
  reset: () => void
}

/**
 * Drives the shared drill lifecycle: idle landing → running countdown → done
 * scorecard. The countdown ticks on `tickMs` (100ms by default, so progress
 * bars animate smoothly) and flips the session to `done` when it hits zero.
 */
export function useTimedSession(tickMs = 100): TimedSession {
  const [phase, setPhase] = useState<Phase>('idle')
  const [timeLeft, setTimeLeft] = useState(0)
  const [duration, setDuration] = useState(0)

  const start = (durationSec: number) => {
    setDuration(durationSec)
    setTimeLeft(durationSec)
    setPhase('running')
  }
  const finish = () => setPhase('done')
  const reset = () => setPhase('idle')

  useEffect(() => {
    if (phase !== 'running') return
    const id = setInterval(() => {
      setTimeLeft((t) => Number((t - tickMs / 1000).toFixed(3)))
    }, tickMs)
    return () => clearInterval(id)
  }, [phase, tickMs])

  useEffect(() => {
    if (phase === 'running' && timeLeft <= 0) setPhase('done')
  }, [phase, timeLeft])

  return { phase, timeLeft, duration, start, finish, reset }
}

/**
 * Records a run to stats exactly once when a session reaches `done`, and resets
 * the guard when a new run starts.
 */
export function useRecordOnFinish(phase: Phase, record: () => void): void {
  const done = useRef(false)
  const recordRef = useRef(record)
  recordRef.current = record
  useEffect(() => {
    if (phase === 'running') done.current = false
    if (phase === 'done' && !done.current) {
      done.current = true
      recordRef.current()
    }
  }, [phase])
}
