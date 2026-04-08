import type { AuthUser } from '../auth'

type PainelSessaoAtivaProps = {
  onLogout: () => void
  user: AuthUser
}

export function PainelSessaoAtiva({
  onLogout,
  user,
}: PainelSessaoAtivaProps) {
  return (
    <div className="welcome-card">
      <span className="panel-tag">Conta ativa</span>
      <h2>{user.username}</h2>
      <p>{user.email}</p>
      <div className="welcome-actions">
        <button className="primary-button" type="button">
          Ir para campanhas
        </button>
        <button className="ghost-button" type="button" onClick={onLogout}>
          Sair
        </button>
      </div>
    </div>
  )
}
