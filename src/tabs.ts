/** Every top-level view in the app, in nav order (number keys follow this order). */
export const TABS = [
  { id: 'firms', label: 'Firms' },
  { id: 'seq', label: 'Sequences' },
  { id: 'prob', label: 'Beat the Odds' },
  { id: 'like', label: 'Likelihood' },
  { id: 'intv', label: 'Intervals' },
  { id: 'ob', label: 'Orderbooks' },
  { id: 'zap', label: 'Zap' },
  { id: 'arith', label: 'Arithmetic' },
  { id: 'stats', label: 'Stats' },
] as const

export type TabId = (typeof TABS)[number]['id']

/** Tabs that are practice drills (not the Firms directory or Stats). */
export type DrillId = Exclude<TabId, 'firms' | 'stats'>

export const tabLabel = (id: TabId): string => TABS.find((t) => t.id === id)?.label ?? id
