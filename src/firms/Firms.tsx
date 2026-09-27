import type { CSSProperties } from 'react'
import { FIRMS } from './firmData'
import { JS_ARCHIVE_URL, JS_PUZZLES } from './janeStreetPuzzles'
import { tabLabel, type TabId } from '../tabs'

interface FirmsProps {
  active: boolean
  /** Switch the app to a drill's tab. */
  onOpen: (id: TabId) => void
}

const external = { target: '_blank', rel: 'noopener noreferrer' } as const

export default function Firms({ active, onOpen }: FirmsProps) {
  return (
    <section className={'panel' + (active ? ' active' : '')} aria-hidden={!active}>
      <div className="panel-head">
        <div className="panel-title">Prep by firm</div>
      </div>
      <div className="panel-sub">
        Pick the firm you're interviewing with and drill the skills its assessments lean on. Each
        chip opens that drill.
      </div>

      <div className="firm-grid">
        {FIRMS.map((f) => (
          <div className="firm-card" key={f.id}>
            <div className="firm-head">
              <span className="firm-id">
                <span
                  className={'firm-icon' + (f.mono.length >= 3 ? ' long' : '')}
                  style={{ '--h': f.hue } as CSSProperties}
                  aria-hidden
                >
                  {f.mono}
                </span>
                <span className="firm-name">{f.name}</span>
              </span>
              {f.documented && <span className="firm-badge">matches OA</span>}
            </div>
            <p className="firm-focus">{f.focus}</p>
            <div className="toggle-group">
              {f.drills.map((d) => (
                <button key={d} type="button" className="chip on" onClick={() => onOpen(d)}>
                  {tabLabel(d)} →
                </button>
              ))}
            </div>
            {f.alsoExpect && (
              <p className="firm-note">
                Also expect: {f.alsoExpect} <span>(not covered here)</span>
              </p>
            )}
            {f.extraLink && (
              <a
                className="firm-extra"
                href={f.extraLink.href}
                onClick={(e) => {
                  // scroll directly: a same-hash click doesn't re-scroll, and we
                  // don't want a hash that later confuses tab navigation
                  const target = document.querySelector(f.extraLink!.href)
                  if (!target) return
                  e.preventDefault()
                  target.scrollIntoView({ block: 'start' })
                }}
              >
                {f.extraLink.label}
              </a>
            )}
          </div>
        ))}
      </div>

      <section className="js-puzzles" id="js-puzzles" aria-labelledby="js-puzzles-title">
        <div className="js-head">
          <h2 id="js-puzzles-title">Jane Street's monthly puzzles</h2>
          <a href={JS_ARCHIVE_URL} {...external}>
            Full archive ↗
          </a>
        </div>
        <p className="js-sub">
          Hard, recreational puzzles Jane Street posts every month or two. They aren't interview
          questions, but they show how the firm likes to think. ★ marks the ones closest to trading
          interviews. Each opens on janestreet.com.
        </p>
        <ul className="js-list">
          {JS_PUZZLES.map((p) => (
            <li key={p.url} className="js-row">
              <span className="js-date">{p.date}</span>
              <div className="js-main">
                <a className="js-title" href={p.url} {...external}>
                  {p.quant && <span aria-label="trading-relevant">★ </span>}
                  {p.title} ↗
                </a>
                <p className="js-blurb">{p.blurb}</p>
              </div>
              <span className={'js-tag' + (p.tag === 'live' ? ' live' : '')}>{p.tag}</span>
              {p.solutionUrl ? (
                <a className="js-sol" href={p.solutionUrl} {...external}>
                  solution ↗
                </a>
              ) : (
                <span className="js-sol muted">no solution yet</span>
              )}
            </li>
          ))}
        </ul>
        <p className="js-credit">Puzzles © Jane Street Group, LLC. Linked here, not reproduced.</p>
      </section>

      <p className="firm-disclaimer">
        Focus areas come from publicly shared candidate reports and vary by role and year. Not
        official, and not affiliated with any firm.
      </p>
    </section>
  )
}
