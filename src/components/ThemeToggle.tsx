import { useTheme } from '../hooks/useTheme'

export function ThemeToggle() {
  const [theme, toggle] = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
    >
      {theme === 'dark' ? '☀ light' : '☾ dark'}
    </button>
  )
}
