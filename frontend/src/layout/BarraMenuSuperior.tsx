import type { AuthUser } from '../auth'
import { BotaoTema, type ThemeMode } from '../theme/BotaoTema'
import { NotificacoesDocumentos } from './NotificacoesDocumentos'

type AppView = 'campanhas' | 'personagens' | 'sessoes'

type BarraMenuSuperiorProps = {
  currentView: AppView
  onLogout: () => void
  onNavigate: (view: AppView) => void
  onToggleTheme: () => void
  theme: ThemeMode
  token: string
  user: AuthUser
}

const MENU_ITEMS: Array<{ disabled?: boolean; label: string; view: AppView }> = [
  { label: 'Campanhas', view: 'campanhas' },
  { label: 'Personagens', view: 'personagens' },
  { label: 'Sessoes', view: 'sessoes', disabled: true },
]

export function BarraMenuSuperior({
  currentView,
  onLogout,
  onNavigate,
  onToggleTheme,
  theme,
  token,
  user,
}: BarraMenuSuperiorProps) {
  return (
    <header className="top-menu">
      <div className="top-menu-brand">
        <span className="eyebrow">RPG Manager</span>
        <strong>{user.username}</strong>
      </div>

      <nav className="top-menu-nav" aria-label="Principal">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.view}
            type="button"
            className={currentView === item.view ? 'menu-link active' : 'menu-link'}
            onClick={() => onNavigate(item.view)}
            disabled={item.disabled}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="top-menu-actions">
        <NotificacoesDocumentos token={token} />
        <BotaoTema onToggle={onToggleTheme} theme={theme} />
        <button className="ghost-button" type="button" onClick={onLogout}>
          Sair
        </button>
      </div>
    </header>
  )
}

export type { AppView }
