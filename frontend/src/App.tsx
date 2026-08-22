import { useEffect, useState } from 'react'
import {
  clearStoredToken,
  getCurrentUser,
  getStoredToken,
  type AuthUser,
} from './auth'
import { TelaAutenticacao } from './auth/TelaAutenticacao'
import { TelaCampanhas } from './campanhas/TelaCampanhas'
import { BarraMenuSuperior, type AppView } from './layout/BarraMenuSuperior'
import './layout/LayoutAplicacao.css'
import { NotificacoesProvider } from './notificacoes/NotificacoesProvider'
import { TelaPersonagemCoc } from './personagens/TelaPersonagemCoc'
import type { ThemeMode } from './theme/BotaoTema'

const THEME_STORAGE_KEY = 'rpg-manager-theme'
const APP_VIEW_STORAGE_KEY = 'rpg-manager-current-view'

function getInitialTheme(): ThemeMode {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  return storedTheme === 'dark' ? 'dark' : 'light'
}

function getInitialAppView(): AppView {
  const storedView = window.localStorage.getItem(APP_VIEW_STORAGE_KEY)
  return storedView === 'personagens' || storedView === 'sessoes' ? storedView : 'campanhas'
}

function App() {
  const [authLoading, setAuthLoading] = useState(true)
  const [currentView, setCurrentView] = useState<AppView>(getInitialAppView)
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme)
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    window.localStorage.setItem(APP_VIEW_STORAGE_KEY, currentView)
  }, [currentView])

  useEffect(() => {
    const token = getStoredToken()

    if (!token) {
      setAuthLoading(false)
      return
    }

    getCurrentUser(token)
      .then((currentUser) => {
        setUser(currentUser)
      })
      .catch(() => {
        clearStoredToken()
      })
      .finally(() => {
        setAuthLoading(false)
      })
  }, [])

  function handleAuthenticated(currentUser: AuthUser) {
    setUser(currentUser)
    setCurrentView('campanhas')
  }

  function handleLogout() {
    clearStoredToken()
    window.localStorage.removeItem(APP_VIEW_STORAGE_KEY)
    setUser(null)
  }

  function handleToggleTheme() {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'))
  }

  const token = getStoredToken()

  if (authLoading) {
    return <main className="app-loading">Carregando...</main>
  }

  if (!user || !token) {
    return <TelaAutenticacao onAuthenticated={handleAuthenticated} />
  }

  return (
    <NotificacoesProvider>
      <div className="app-shell">
        <BarraMenuSuperior
          currentView={currentView}
          onLogout={handleLogout}
          onNavigate={setCurrentView}
          onToggleTheme={handleToggleTheme}
          theme={theme}
          token={token}
          user={user}
        />

        <main className="app-content">
          {currentView === 'campanhas' ? (
            <TelaCampanhas token={token} user={user} />
          ) : currentView === 'personagens' ? (
            <TelaPersonagemCoc token={token} />
          ) : (
            <section className="panel-surface">
              <span className="panel-tag">Em breve</span>
              <h2>Essa area ainda nao foi implementada.</h2>
            </section>
          )}
        </main>
      </div>
    </NotificacoesProvider>
  )
}

export default App
