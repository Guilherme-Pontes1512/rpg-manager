import type { FormEvent } from 'react'

type LoginState = {
  email: string
  senha: string
}

type FormularioLoginProps = {
  error: string
  loginForm: LoginState
  onChange: (field: keyof LoginState, value: string) => void
  onForgotPassword: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  success: string
  submitting: boolean
}

export function FormularioLogin({
  error,
  loginForm,
  onChange,
  onForgotPassword,
  onSubmit,
  success,
  submitting,
}: FormularioLoginProps) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <header>
        <span className="panel-tag">Acesso</span>
        <h2>Login por email</h2>
        <p>Use as mesmas credenciais que o backend valida via Basic Auth.</p>
      </header>

      <label>
        <span>Email</span>
        <input
          type="email"
          placeholder="voce@mesa.com"
          value={loginForm.email}
          onChange={(event) => onChange('email', event.target.value)}
          required
        />
      </label>

      <div className="auth-field-header">
        <span>Senha</span>
        <button className="auth-text-link" type="button" onClick={onForgotPassword}>
          Esqueci minha senha?
        </button>
      </div>

      <label>
        <input
          type="password"
          placeholder="Sua senha"
          value={loginForm.senha}
          onChange={(event) => onChange('senha', event.target.value)}
          required
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}
      {success ? <p className="form-success">{success}</p> : null}

      <button className="primary-button" type="submit" disabled={submitting}>
        {submitting ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}

export type { LoginState }
