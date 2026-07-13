import { Fragment, useState } from 'react'
import {
  BUNDLE,
  evaluateOrderbook,
  generateOrderbook,
  type ObAction,
  type ObResult,
  type OrderbookData,
  type OrderbookRow,
} from './generator'
import { recordAttempt } from '../../lib/stats'
import { Stat } from '../../components/Stat'
import { Feedback } from '../../components/Feedback'

const initActions = (data: OrderbookData): Record<string, ObAction> => {
  const acts: Record<string, ObAction> = { [BUNDLE]: 'skip' }
  for (const i of data.items) acts[i.name] = 'skip'
  return acts
}

export default function Orderbooks({ active }: { active: boolean }) {
  const [data, setData] = useState<OrderbookData>(generateOrderbook)
  const [actions, setActions] = useState<Record<string, ObAction>>(() => initActions(data))
  const [result, setResult] = useState<ObResult | null>(null)
  const [score, setScore] = useState(0)
  const [seen, setSeen] = useState(0)

  const setAction = (name: string, a: ObAction) => {
    if (result) return // locked in
    setActions((prev) => ({ ...prev, [name]: a }))
  }

  const lockIn = () => {
    if (result) return
    const r = evaluateOrderbook(data, actions)
    setResult(r)
    setSeen((s) => s + 1)
    if (r.solved) setScore((s) => s + 1)
    recordAttempt('orderbooks', data.scenario, r.solved)
  }

  const newBook = () => {
    const d = generateOrderbook()
    setData(d)
    setActions(initActions(d))
    setResult(null)
  }

  const rows: OrderbookRow[] = [...data.items, data.bundle]

  return (
    <section className={'panel' + (active ? ' active' : '')} aria-hidden={!active}>
      <div className="panel-head">
        <div className="panel-title">Orderbooks</div>
        <div className="stats">
          <Stat value={score} label="solved" />
          <Stat value={seen} label="seen" />
        </div>
      </div>
      <div className="panel-sub">
        You buy at the ask, sell at the bid. Build the bundle from parts and sell it, or buy the
        bundle and break it into parts — pick the profitable direction. Sometimes there's no
        arbitrage: the right move is to skip everything.
      </div>

      <div className="ob-grid" role="grid">
        <div className="ob-cell head">Item</div>
        <div className="ob-cell head">Bid (sell)</div>
        <div className="ob-cell head">Ask (buy)</div>
        <div className="ob-cell head">Your action</div>
        {rows.map((r) => {
          const isBundle = r.name === BUNDLE
          return (
            <Fragment key={r.name}>
              <div className={'ob-cell item' + (isBundle ? ' bundle' : '')}>
                {isBundle ? '📦 Bundle' : r.name}
              </div>
              <div className="ob-cell">${r.bid}</div>
              <div className="ob-cell">${r.ask}</div>
              <div className="ob-cell action">
                <div className="act-group">
                  {(['buy', 'sell', 'skip'] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      className={`act ${a}` + (actions[r.name] === a ? ' on' : '')}
                      aria-pressed={actions[r.name] === a}
                      onClick={() => setAction(r.name, a)}
                    >
                      {a === 'skip' ? '—' : a === 'buy' ? 'Buy' : 'Sell'}
                    </button>
                  ))}
                </div>
              </div>
            </Fragment>
          )
        })}
      </div>

      <div className="controls" style={{ marginTop: 16 }}>
        {!result && (
          <button type="button" className="btn" onClick={lockIn}>
            Lock in trade
          </button>
        )}
        {result && (
          <button type="button" className="btn ghost" onClick={newBook}>
            New book →
          </button>
        )}
      </div>

      {result && (
        <div style={{ marginTop: 16 }}>
          <Feedback
            ok={result.solved}
            tag={result.solved ? 'solved' : 'missed'}
            workHtml={
              result.note +
              (result.valid && result.profit !== null
                ? ` Your profit: <b>${result.profit >= 0 ? '+' : ''}$${result.profit}</b>.`
                : '') +
              '<br>Best available: ' +
              result.bestLabel
            }
          />
        </div>
      )}
    </section>
  )
}
