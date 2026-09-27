import { FIRMS } from './firmData'
import { tabLabel, type TabId } from '../tabs'

interface FirmsProps {
  active: boolean
  /** Switch the app to a drill's tab. */
  onOpen: (id: TabId) => void
}

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
              <span className="firm-name">{f.name}</span>
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
          </div>
        ))}
      </div>

      <p className="firm-disclaimer">
        Focus areas come from publicly shared candidate reports and vary by role and year. Not
        official, and not affiliated with any firm.
      </p>
    </section>
  )
}
