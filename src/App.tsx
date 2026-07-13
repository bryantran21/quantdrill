import { useEffect, useState } from 'react'
import Sequences from './drills/Sequences/Sequences'
import BeatTheOdds from './drills/BeatTheOdds/BeatTheOdds'
import Orderbooks from './drills/Orderbooks/Orderbooks'
import Zap from './drills/Zap/Zap'
import Arithmetic from './drills/Arithmetic/Arithmetic'
import Stats from './drills/Stats/Stats'
import { ThemeToggle } from './components/ThemeToggle'

// TODO: mock-test mode — run all sections back-to-back with per-section
// timers and a final scorecard (see the roadmap in README.md).

const TABS = [
  { id: 'seq', label: 'Sequences' },
  { id: 'prob', label: 'Beat the Odds' },
  { id: 'ob', label: 'Orderbooks' },
  { id: 'zap', label: 'Zap' },
  { id: 'arith', label: 'Arithmetic' },
  { id: 'stats', label: 'Stats' },
] as const

type TabId = (typeof TABS)[number]['id']

export default function App() {
  const [tab, setTab] = useState<TabId>('seq')

  // 1–6 switch drills anywhere except inside a text field
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
      <Sequences active={tab === 'seq'} />
      <BeatTheOdds active={tab === 'prob'} />
      <Orderbooks active={tab === 'ob'} />
      <Zap active={tab === 'zap'} />
      <Arithmetic active={tab === 'arith'} />
      <Stats active={tab === 'stats'} />

      <footer>
        built for reps · warm up on the Arithmetic tab before the real thing
        <br />
        keys: <span className="kbd-inline">1</span>–<span className="kbd-inline">6</span> switch
        sections · <span className="kbd-inline">enter</span> submit ·{' '}
        <span className="kbd-inline">←</span>/<span className="kbd-inline">→</span> in Zap
      </footer>
    </div>
  )
}
