type ThemeMode = 'light' | 'dark'

type BotaoTemaProps = {
  onToggle: () => void
  theme: ThemeMode
}

export function BotaoTema({ onToggle, theme }: BotaoTemaProps) {
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
    >
      <span className="theme-toggle-track">
        <span className="theme-toggle-thumb">{isDark ? '🌙' : '☀'}</span>
      </span>
    </button>
  )
}

export type { ThemeMode }
