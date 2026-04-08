import type { FormEvent } from 'react'
import type { RegisterInput } from '../auth'

type FormularioCadastroProps = {
  error: string
  onChange: (field: keyof RegisterInput, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  registerForm: RegisterInput
  success: string
  submitting: boolean
}

export function FormularioCadastro({
  error,
  onChange,
  onSubmit,
  registerForm,
  success,
  submitting,
}: FormularioCadastroProps) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <header>
        <span className="panel-tag">Nova conta</span>
        <h2>Cadastro rapido</h2>
        <p>Nome, username e email sao tratados de forma explicita.</p>
      </header>

      <label>
        <span>Nome</span>
        <input
          type="text"
          placeholder="Nome"
          value={registerForm.nome}
          onChange={(event) => onChange('nome', event.target.value)}
          required
          minLength={2}
        />
      </label>

      <label>
        <span>Nome de usuário</span>
        <input
          type="text"
          placeholder="GuardiaoDaMesa"
          value={registerForm.username}
          onChange={(event) => onChange('username', event.target.value)}
          required
          minLength={3}
        />
      </label>

      <label>
        <span>E-mail</span>
        <input
          type="email"
          placeholder="voce@mesa.com"
          value={registerForm.email}
          onChange={(event) => onChange('email', event.target.value)}
          required
        />
      </label>

      <label>
        <span>Senha</span>
        <input
          type="password"
          placeholder="No minimo 6 caracteres"
          value={registerForm.senha}
          onChange={(event) => onChange('senha', event.target.value)}
          required
          minLength={6}
        />
      </label>

      <label>
        <span>Confirmar a senha</span>
        <input
          type="password"
          placeholder="Repita a senha"
          value={registerForm.confirmarSenha}
          onChange={(event) => onChange('confirmarSenha', event.target.value)}
          required
          minLength={6}
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}
      {success ? <p className="form-success">{success}</p> : null}

      <button className="primary-button" type="submit" disabled={submitting}>
        {submitting ? 'Criando conta...' : 'Criar conta'}
      </button>
    </form>
  )
}
