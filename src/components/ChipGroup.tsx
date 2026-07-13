interface ChipGroupProps<T extends string> {
  options: readonly { id: T; label: string }[]
  active: ReadonlySet<T>
  onToggle: (id: T) => void
}

/** Row of toggleable filter chips (multi-select unless the caller enforces otherwise). */
export function ChipGroup<T extends string>({ options, active, onToggle }: ChipGroupProps<T>) {
  return (
    <div className="toggle-group">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={'chip' + (active.has(o.id) ? ' on' : '')}
          aria-pressed={active.has(o.id)}
          onClick={() => onToggle(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
