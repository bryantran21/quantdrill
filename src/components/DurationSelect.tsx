interface DurationSelectProps {
  value: number
  options: number[]
  onChange: (seconds: number) => void
}

const label = (s: number) => (s % 60 === 0 ? `${s / 60} min` : `${s} sec`)

export function DurationSelect({ value, options, onChange }: DurationSelectProps) {
  return (
    <div className="duration-row">
      <label htmlFor="duration">Duration</label>
      <select
        id="duration"
        className="select"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {options.map((s) => (
          <option key={s} value={s}>
            {label(s)}
          </option>
        ))}
      </select>
    </div>
  )
}
