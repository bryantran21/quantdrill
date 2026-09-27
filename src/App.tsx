import { useEffect, useState } from 'react'
import Firms from './firms/Firms'
import Sequences from './drills/Sequences/Sequences'
import BeatTheOdds from './drills/BeatTheOdds/BeatTheOdds'
import Likelihood from './drills/Likelihood/Likelihood'
import Intervals from './drills/Intervals/Intervals'
import Orderbooks from './drills/Orderbooks/Orderbooks'
import Zap from './drills/Zap/Zap'
import Arithmetic from './drills/Arithmetic/Arithmetic'
import Stats from './drills/Stats/Stats'
import { ThemeToggle } from './components/ThemeToggle'
import { TABS, type TabId } from './tabs'

// TODO: mock-test mode — run all sections back-to-back with per-section
// timers and a final scorecard (see the roadmap in README.md).

export default function App() {
  const [tab, setTab] = useState<TabId>('firms')

  // jumping in from the firm directory should land at the top of the drill
  const open = (id: TabId) => {
    setTab(id)
    window.scrollTo({ top: 0 })
  }

  // number keys switch tabs anywhere except inside a text field
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') return
      const i = Number(e.key) - 1
      if (i >= 0 && i < TABS.length) setTab(TABS[i].id)
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  return (
    <div className="wrap">
      <header>
        <div>
          <div className="logo">
            Quant<b>Drill</b>
          </div>
          <div className="tagline">{'// aptitude reps for trading assessments'}</div>
        </div>
        <ThemeToggle />
      </header>

      <nav className="tabs" aria-label="Drills">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? 'active' : ''}
            aria-current={tab === t.id}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            <span className="k">{i + 1}</span>
          </button>
        ))}
      </nav>

      {/* all panels stay mounted so scores and timers survive tab switches */}
      <Firms active={tab === 'firms'} onOpen={open} />
      <Sequences active={tab === 'seq'} />
      <BeatTheOdds active={tab === 'prob'} />
      <Likelihood active={tab === 'like'} />
      <Intervals active={tab === 'intv'} />
      <Orderbooks active={tab === 'ob'} />
      <Zap active={tab === 'zap'} />
      <Arithmetic active={tab === 'arith'} />
      <Stats active={tab === 'stats'} />

      <footer>
        built for reps · warm up on the Arithmetic tab before the real thing
        <br />
        keys: <span className="kbd-inline">1</span>–<span className="kbd-inline">9</span> switch
        sections · <span className="kbd-inline">enter</span> submit ·{' '}
        <span className="kbd-inline">←</span>/<span className="kbd-inline">→</span> in Zap
      </footer>
    </div>
  )
}
