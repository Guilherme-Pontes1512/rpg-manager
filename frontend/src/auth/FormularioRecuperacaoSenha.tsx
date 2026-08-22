import type { FormEvent } from 'react'

type ForgotPasswordState = {
  email: string
}

type ResetPasswordState = {
  confirmarSenha: string
  senha: string
}

type FormularioRecuperacaoSenhaProps = {
  error: string
  forgotForm: ForgotPasswordState
  onBackToLogin: () => void
  onForgotChange: (field: keyof ForgotPasswordState, value: string) => void
  onForgotSubmit: (event: FormEvent<HTMLFormElement>) => void
  onResetChange: (field: keyof ResetPasswordState, value: string) => void
  onResetSubmit: (event: FormEvent<HTMLFormElement>) => void
  resetForm: ResetPasswordState
  resetToken: string | null
  submitting: boolean
  success: string
}

export function FormularioRecuperacaoSenha({
  error,
  forgotForm,
  onBackToLogin,
  onForgotChange,
  onForgotSubmit,
  onResetChange,
  onResetSubmit,
  resetForm,
  resetToken,
  submitting,
  success,
}: FormularioRecuperacaoSenhaProps) {
  return resetToken ? (
    <form className="auth-form" onSubmit={onResetSubmit}>
      <header>
        <span className="panel-tag">Recuperacao</span>
        <h2>Definir nova senha</h2>
        <p>Cadastre uma nova senha para concluir a recuperacao da conta.</p>
      </header>

      <label>
        <span>Nova senha</span>
        <input
          type="password"
          placeholder="Minimo de 6 caracteres"
          value={resetForm.senha}
          onChange={(event) => onResetChange('senha', event.target.value)}
          required
        />
      </label>

      <label>
        <span>Confirmar nova senha</span>
        <input
          type="password"
          placeholder="Repita a nova senha"
          value={resetForm.confirmarSenha}
          onChange={(event) => onResetChange('confirmarSenha', event.target.value)}
          required
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}
      {success ? <p className="form-success">{success}</p> : null}

      <button className="primary-button" type="submit" disabled={submitting}>
        {submitting ? 'Salvando...' : 'Salvar nova senha'}
      </button>

      <button className="ghost-button" type="button" onClick={onBackToLogin}>
        Voltar para login
      </button>
    </form>
  ) : (
    <form className="auth-form" onSubmit={onForgotSubmit}>
      <header>
        <span className="panel-tag">Recuperacao</span>
        <h2>Esqueci minha senha</h2>
        <p>Informe seu email e enviaremos um link para redefinir sua senha.</p>
      </header>

      <label>
        <span>Email</span>
        <input
          type="email"
          placeholder="voce@mesa.com"
          value={forgotForm.email}
          onChange={(event) => onForgotChange('email', event.target.value)}
          required
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}
      {success ? <p className="form-success">{success}</p> : null}

      <button className="primary-button" type="submit" disabled={submitting}>
        {submitting ? 'Enviando...' : 'Enviar link de recuperacao'}
      </button>

      <button className="ghost-button" type="button" onClick={onBackToLogin}>
        Voltar para login
      </button>
    </form>
  )
}

export type { ForgotPasswordState, ResetPasswordState }
