import { useState } from 'react'
import {
  evaluateBoard,
  generateOrderbook,
  type Card,
  type ObResult,
  type OrderbookData,
  type Positions,
  type Side,
} from './generator'
import { bestRun, recordAttempt, recordRun } from '../../lib/stats'
import { useRecordOnFinish, useTimedSession } from '../../session/useTimedSession'
import { Stat } from '../../components/Stat'
import { Feedback } from '../../components/Feedback'
import { DurationSelect } from '../../components/DurationSelect'
import { Landing } from '../../components/Landing'
import { Scorecard } from '../../components/Scorecard'
import { RunBar } from '../../components/RunBar'

const DURATIONS = [180, 300, 600]
const MODE = 'orderbooks'

const emptyPositions = (data: OrderbookData): Positions =>
  Object.fromEntries(data.cards.map((c) => [c.id, 'none'])) as Positions

function compositionLabel(card: Card, assets: OrderbookData['assets']): string {
  const name = (id: string) => assets.find((a) => a.id === id)?.name ?? id
  return card.composition.map((u) => `${u.qty}× ${name(u.asset)}`).join(' + ')
}

export default function Orderbooks({ active }: { active: boolean }) {
  const s = useTimedSession()
  const [duration, setDuration] = useState(300)
  const [data, setData] = useState<OrderbookData>(generateOrderbook)
  const [positions, setPositions] = useState<Positions>(() => emptyPositions(data))
  const [result, setResult] = useState<ObResult | null>(null)
  const [score, setScore] = useState(0)
  const [seen, setSeen] = useState(0)

  useRecordOnFinish(s.phase, () => recordRun(MODE, score))

  const newBoard = () => {
    const d = generateOrderbook()
    setData(d)
    setPositions(emptyPositions(d))
    setResult(null)
  }

  const start = () => {
    setScore(0)
    setSeen(0)
    newBoard()
    s.start(duration)
  }

  const setSide = (id: string, side: Side) => {
    if (result) return
    setPositions((p) => ({ ...p, [id]: p[id] === side ? 'none' : side }))
  }

  const submit = (asSkip: boolean) => {
    if (result || s.phase !== 'running') return
    const pos = asSkip ? emptyPositions(data) : positions
    if (asSkip) setPositions(pos)
    const r = evaluateBoard(data, pos)
    setResult(r)
    setSeen((n) => n + 1)
    if (r.solved) setScore((n) => n + 1)
    recordAttempt(MODE, data.hasArb ? 'arb' : 'no-arb', r.solved)
  }

  const bestLabel = data.best > 0
    ? `Best: lock in <b>+$${data.best}</b> — ${describeBest(data)}.`
    : 'No arbitrage here — every hedged position loses or breaks even. <b>Correct move: skip.</b>'

  return (
    <section className={'panel' + (active ? ' active' : '')} aria-hidden={!active}>
      <div className="panel-head">
        <div className="panel-title">Orderbooks</div>
        <div className="stats">
          <Stat value={score} label="solved" />
          <Stat value={seen} label="seen" />
          {s.phase === 'running' && (
            <Stat
              value={Math.max(0, Math.ceil(s.timeLeft))}
              label="seconds"
              tone={s.timeLeft <= 15 ? 'crit' : s.timeLeft <= 45 ? 'low' : undefined}
            />
          )}
        </div>
      </div>
      <div className="panel-sub">
        Each card has a <b>buy</b> price and a <b>sell</b> price. Buy some and sell others so every
        item nets out (a closed position) and you pocket cash — or skip if there's no edge. Bundles
        (🪣) are worth their contents.
      </div>

      {s.phase === 'idle' && (
        <Landing onStart={start} startLabel="Start">
          <div className="landing-hint">
            Solve as many boards as you can. Buy the cheap side, sell the dear side, keep your net
            position flat.
          </div>
          <DurationSelect value={duration} options={DURATIONS} onChange={setDuration} />
        </Landing>
      )}

      {s.phase === 'running' && (
        <>
          <div className="ob-cards">
            {data.cards.map((c) => (
              <div key={c.id} className={'ob-card' + (c.isBundle ? ' bundle' : '')}>
                <div className="ob-card-head">
                  <span className="ob-icon">{c.icon}</span>
                  <span className="ob-name">{c.name}</span>
                </div>
                <div className="ob-recipe">
                  {c.isBundle ? compositionLabel(c, data.assets) : ' '}
                </div>
                <div className="ob-sides">
                  <button
                    type="button"
                    disabled={!!result}
                    className={'ob-side buy' + (positions[c.id] === 'buy' ? ' on' : '')}
                    onClick={() => setSide(c.id, 'buy')}
                  >
                    <span className="s-label">buy</span>${c.buy}
                  </button>
                  <button
                    type="button"
                    disabled={!!result}
                    className={'ob-side sell' + (positions[c.id] === 'sell' ? ' on' : '')}
                    onClick={() => setSide(c.id, 'sell')}
                  >
                    <span className="s-label">sell</span>${c.sell}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="controls" style={{ marginTop: 16 }}>
            {!result ? (
              <>
                <button type="button" className="btn" onClick={() => submit(false)}>
                  Submit
                </button>
                <button type="button" className="btn ghost" onClick={() => submit(true)}>
                  Skip — no arb
                </button>
              </>
            ) : (
              <button type="button" className="btn" onClick={newBoard}>
                Next board →
              </button>
            )}
          </div>

          {result && (
            <div style={{ marginTop: 16 }}>
              <Feedback
                ok={result.solved}
                tag={result.solved ? 'solved' : result.hedged ? 'missed' : 'open position'}
                workHtml={
                  (result.hedged
                    ? `Your position nets flat for <b>${result.cash >= 0 ? '+' : ''}$${result.cash}</b>.`
                    : "Your position isn't closed — some item is left long or short, so it isn't risk-free.") +
                  '<br>' +
                  bestLabel
                }
              />
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <RunBar frac={s.timeLeft / s.duration} />
          </div>
        </>
      )}

      {s.phase === 'done' && (
        <Scorecard
          headline={score}
          headlineUnit="solved"
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

/** Plain-language description of one optimal position for the feedback line. */
function describeBest(data: OrderbookData): string {
  const buys = data.cards.filter((c) => data.bestPositions[c.id] === 'buy').map((c) => c.name)
  const sells = data.cards.filter((c) => data.bestPositions[c.id] === 'sell').map((c) => c.name)
  const parts: string[] = []
  if (buys.length) parts.push(`buy ${buys.join(' + ')}`)
  if (sells.length) parts.push(`sell ${sells.join(' + ')}`)
  return parts.join(', ')
}
