import { createContext, useContext, useMemo, useRef, useState } from 'react'
import type { PropsWithChildren } from 'react'
import './Notificacoes.css'

type TipoNotificacao = 'success' | 'error' | 'info'

type Notificacao = {
  id: number
  message: string
  type: TipoNotificacao
}

type NotificacoesContextValue = {
  notify: (type: TipoNotificacao, message: string) => void
}

const NotificacoesContext = createContext<NotificacoesContextValue | null>(null)

export function NotificacoesProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<Notificacao[]>([])
  const nextId = useRef(1)

  const value = useMemo<NotificacoesContextValue>(
    () => ({
      notify(type, message) {
        const id = nextId.current++
        setItems((current) => [...current, { id, message, type }])

        window.setTimeout(() => {
          setItems((current) => current.filter((item) => item.id !== id))
        }, 4200)
      },
    }),
    [],
  )

  return (
    <NotificacoesContext.Provider value={value}>
      {children}
      <div className="notifications-layer" aria-live="polite" aria-atomic="true">
        {items.map((item) => (
          <div
            key={item.id}
            className={`notification-toast notification-${item.type}`}
            role="status"
          >
            {item.message}
          </div>
        ))}
      </div>
    </NotificacoesContext.Provider>
  )
}

export function useNotificacoes() {
  const context = useContext(NotificacoesContext)

  if (!context) {
    throw new Error('useNotificacoes precisa ser usado dentro de NotificacoesProvider')
  }

  return context
}
