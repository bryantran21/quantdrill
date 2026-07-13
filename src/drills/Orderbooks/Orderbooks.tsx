import { useState } from 'react'
import {
  evaluateBoard,
  generateOrderbook,
  type Card,
  type ObResult,
  type OrderbookData,
  type Positions,
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

const assetName = (assets: OrderbookData['assets'], id: string) =>
  assets.find((a) => a.id === id)?.name ?? id
const assetIcon = (assets: OrderbookData['assets'], id: string) =>
  assets.find((a) => a.id === id)?.icon ?? '📦'

/** Bundle icon = its component emojis repeated by quantity, e.g. 🧂🧂 or 🟠🟠🪵. */
const bundleEmoji = (card: Card, assets: OrderbookData['assets']) =>
  card.composition.map((u) => assetIcon(assets, u.asset).repeat(u.qty)).join('')

const recipe = (card: Card, assets: OrderbookData['assets']) =>
  card.composition.map((u) => `${u.qty}× ${assetName(assets, u.asset)}`).join(' + ')

export default function Orderbooks({ active }: { active: boolean }) {
  const s = useTimedSession()
  const [duration, setDuration] = useState(300)
  const [data, setData] = useState<OrderbookData>(generateOrderbook)
  const [positions, setPositions] = useState<Positions>({})
  const [result, setResult] = useState<ObResult | null>(null)
  const [score, setScore] = useState(0)
  const [seen, setSeen] = useState(0)

  useRecordOnFinish(s.phase, () => recordRun(MODE, score))

  const newBoard = () => {
    setData(generateOrderbook())
    setPositions({})
    setResult(null)
  }

  const start = () => {
    setScore(0)
    setSeen(0)
    newBoard()
    s.start(duration)
  }

  // click Buy → +1 unit, Sell → −1 unit, clamped to the board's unit cap
  const nudge = (id: string, delta: number) => {
    if (result) return
    setPositions((p) => {
      const q = Math.max(-data.maxUnits, Math.min(data.maxUnits, (p[id] ?? 0) + delta))
      return { ...p, [id]: q }
    })
  }

  const submit = (asSkip: boolean) => {
    if (result || s.phase !== 'running') return
    const pos = asSkip ? {} : positions
    if (asSkip) setPositions({})
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
        Each card has a <b>buy</b> and a <b>sell</b> price. Buy some and sell others so every item
        nets out (a closed position) and you pocket cash — or skip if there's no edge. Click a side
        more than once to trade several units (needed to match a bundle's contents).
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
            {data.cards.map((c) => {
              const q = positions[c.id] ?? 0
              return (
                <div key={c.id} className={'ob-card' + (c.isBundle ? ' bundle' : '')}>
                  <div className="ob-card-head">
                    <span className="ob-icon">
                      {c.isBundle ? bundleEmoji(c, data.assets) : c.icon}
                    </span>
                    <span className="ob-name">{c.name}</span>
                  </div>
                  <div className="ob-recipe">{c.isBundle ? recipe(c, data.assets) : ' '}</div>
                  <div className="ob-sides">
                    <button
                      type="button"
                      disabled={!!result}
                      className={'ob-side buy' + (q > 0 ? ' on' : '')}
                      onClick={() => nudge(c.id, 1)}
                    >
                      <span className="s-label">buy{q > 0 ? ` ×${q}` : ''}</span>${c.buy}
                    </button>
                    <button
                      type="button"
                      disabled={!!result}
                      className={'ob-side sell' + (q < 0 ? ' on' : '')}
                      onClick={() => nudge(c.id, -1)}
                    >
                      <span className="s-label">sell{q < 0 ? ` ×${-q}` : ''}</span>${c.sell}
                    </button>
                  </div>
                </div>
              )
            })}
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

/** Plain-language description of one optimal position, with quantities. */
function describeBest(data: OrderbookData): string {
  const label = (c: Card, q: number) => (q > 1 ? `${q}× ${c.name}` : c.name)
  const buys = data.cards
    .filter((c) => (data.bestPositions[c.id] ?? 0) > 0)
    .map((c) => label(c, data.bestPositions[c.id]))
  const sells = data.cards
    .filter((c) => (data.bestPositions[c.id] ?? 0) < 0)
    .map((c) => label(c, -data.bestPositions[c.id]))
  const parts: string[] = []
  if (buys.length) parts.push(`buy ${buys.join(' + ')}`)
  if (sells.length) parts.push(`sell ${sells.join(' + ')}`)
  return parts.join(', ')
}
