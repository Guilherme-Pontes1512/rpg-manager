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

function getInitialTheme(): ThemeMode {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  return storedTheme === 'dark' ? 'dark' : 'light'
}

function App() {
  const [authLoading, setAuthLoading] = useState(true)
  const [currentView, setCurrentView] = useState<AppView>('campanhas')
  const [statusMessage, setStatusMessage] = useState('Carregando sessao...')
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme)
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    const token = getStoredToken()

    if (!token) {
      setAuthLoading(false)
      setStatusMessage('Entre com sua conta para acessar o gerenciador.')
      return
    }

    getCurrentUser(token)
      .then((currentUser) => {
        setUser(currentUser)
        setStatusMessage(`Sessao restaurada para ${currentUser.username}.`)
      })
      .catch(() => {
        clearStoredToken()
        setStatusMessage('Sua sessao expirou. Faca login novamente.')
      })
      .finally(() => {
        setAuthLoading(false)
      })
  }, [])

  function handleAuthenticated(currentUser: AuthUser) {
    setUser(currentUser)
    setCurrentView('campanhas')
    setStatusMessage(`Sessao ativa para ${currentUser.username}.`)
  }

  function handleLogout() {
    clearStoredToken()
    setUser(null)
    setStatusMessage('Sessao encerrada.')
  }

  function handleToggleTheme() {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'))
  }

  const token = getStoredToken()

  if (authLoading) {
    return <main className="app-loading">Carregando...</main>
  }

  if (!user || !token) {
    return (
      <TelaAutenticacao
        onAuthenticated={handleAuthenticated}
        statusMessage={statusMessage}
      />
    )
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
