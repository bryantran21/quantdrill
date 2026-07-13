import { useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

/**
 * Theme state backed by <html data-theme>. First load resolves from
 * localStorage / prefers-color-scheme in an inline script in index.html,
 * so this hook just reads what is already applied and persists changes.
 */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(
    () => (document.documentElement.dataset.theme as Theme) || 'dark',
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('qd-theme', theme)
    } catch {
      // private mode — theme just won't persist
    }
  }, [theme])

  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))]
}
