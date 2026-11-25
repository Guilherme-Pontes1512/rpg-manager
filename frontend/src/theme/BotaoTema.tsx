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
        <span className="theme-toggle-thumb" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            {isDark ? (
              <path d="M20 14a8 8 0 0 1-10-10 8 8 0 1 0 10 10Z" />
            ) : (
              <>
                <circle cx="12" cy="12" r="4" />
                <path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2" />
              </>
            )}
          </svg>
        </span>
      </span>
    </button>
  )
}

export type { ThemeMode }
