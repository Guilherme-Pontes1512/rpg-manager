import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './TelaAutenticacao.css'
import {
  forgotPassword,
  login,
  register,
  resendVerificationEmail,
  resetPassword,
  verifyEmail,
  type AuthUser,
  type RegisterInput,
} from '../auth'
import type { AuthMode } from '../types'
import { FormularioCadastro } from './FormularioCadastro'
import { FormularioLogin, type LoginState } from './FormularioLogin'
import {
  FormularioRecuperacaoSenha,
  type ForgotPasswordState,
  type ResetPasswordState,
} from './FormularioRecuperacaoSenha'

const initialLogin: LoginState = {
  email: '',
  senha: '',
}

const initialRegister: RegisterInput = {
  nome: '',
  username: '',
  email: '',
  senha: '',
  confirmarSenha: '',
}

const initialForgotPassword: ForgotPasswordState = {
  email: '',
}

const initialResetPassword: ResetPasswordState = {
  confirmarSenha: '',
  senha: '',
}

type TelaAutenticacaoProps = {
  onAuthenticated: (user: AuthUser) => void
  statusMessage: string
}

export function TelaAutenticacao({
  onAuthenticated,
  statusMessage,
}: TelaAutenticacaoProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [loginForm, setLoginForm] = useState<LoginState>(initialLogin)
  const [registerForm, setRegisterForm] = useState<RegisterInput>(initialRegister)
  const [forgotPasswordForm, setForgotPasswordForm] = useState<ForgotPasswordState>(initialForgotPassword)
  const [resetPasswordForm, setResetPasswordForm] = useState<ResetPasswordState>(initialResetPassword)
  const [resetPasswordToken, setResetPasswordToken] = useState<string | null>(null)
  const [registrationNoticeOpen, setRegistrationNoticeOpen] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const verifyToken = params.get('verifyEmailToken')
    const resetToken = params.get('resetPasswordToken')

    if (resetToken) {
      setMode('forgotPassword')
      setResetPasswordToken(resetToken)
      setError('')
      setSuccess('')
      return
    }

    if (!verifyToken) {
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    verifyEmail(verifyToken)
      .then(() => {
        setMode('login')
        setSuccess('Email confirmado com sucesso. Agora voce ja pode fazer login.')
        window.history.replaceState({}, '', window.location.pathname)
      })
      .catch((caughtError) => {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : 'Nao foi possivel confirmar seu email.'
        setError(message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }, [])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const { user: currentUser } = await login(loginForm.email, loginForm.senha)
      setLoginForm(initialLogin)
      onAuthenticated(currentUser)
    } catch {
      setError('Email ou senha invalidos. Se voce acabou de se cadastrar, confirme seu email antes de entrar.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    if (registerForm.senha !== registerForm.confirmarSenha) {
      setError('A confirmacao de senha precisa ser igual a senha.')
      setSubmitting(false)
      return
    }

    try {
      await register(registerForm)
      setVerificationEmail(registerForm.email)
      setLoginForm({
        email: registerForm.email,
        senha: '',
      })
      setForgotPasswordForm({
        email: registerForm.email,
      })
      setRegisterForm(initialRegister)
      setMode('login')
      setRegistrationNoticeOpen(true)
      setSuccess('')
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Nao foi possivel concluir o cadastro.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  function updateLoginField(field: keyof LoginState, value: string) {
    setLoginForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateRegisterField(field: keyof RegisterInput, value: string) {
    setRegisterForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateForgotPasswordField(field: keyof ForgotPasswordState, value: string) {
    setForgotPasswordForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateResetPasswordField(field: keyof ResetPasswordState, value: string) {
    setResetPasswordForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleResendVerification(emailParam?: string) {
    const email = emailParam?.trim() || verificationEmail.trim() || loginForm.email.trim() || registerForm.email.trim()
    if (!email) {
      setError('Informe seu email para reenviar a confirmacao.')
      setSuccess('')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await resendVerificationEmail(email)
      setSuccess(response.message)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Nao foi possivel reenviar o email de confirmacao.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await forgotPassword(forgotPasswordForm.email)
      setSuccess(response.message)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Nao foi possivel iniciar a recuperacao de senha.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!resetPasswordToken) {
      setError('Token de recuperacao ausente.')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await resetPassword(
        resetPasswordToken,
        resetPasswordForm.senha,
        resetPasswordForm.confirmarSenha,
      )
      setResetPasswordForm(initialResetPassword)
      setResetPasswordToken(null)
      setMode('login')
      setSuccess(response.message)
      window.history.replaceState({}, '', window.location.pathname)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Nao foi possivel redefinir a senha.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  function voltarParaLogin() {
    setMode('login')
    setResetPasswordToken(null)
    setResetPasswordForm(initialResetPassword)
    setError('')
    setSuccess('')
    window.history.replaceState({}, '', window.location.pathname)
  }

  return (
    <main className="shell">
      <section className="hero-panel">
        <p className="eyebrow">RPG Manager</p>
        <h1>Entre na mesa sem abrir outra aba.</h1>
        <p className="hero-copy">
          Login por email e senha, cadastro simples e sessao pronta para a
          futura area do app.
        </p>
        <div className="hero-card">
          <span className="hero-label">Status</span>
          <strong>Nao autenticado</strong>
          <p>{statusMessage}</p>
        </div>
      </section>

      <section className="auth-panel">
        <>
          <div className="tab-row" role="tablist" aria-label="Autenticacao">
            <button
              type="button"
              className={mode === 'login' ? 'tab active' : 'tab'}
              onClick={() => {
                setMode('login')
                setError('')
              }}
            >
              Login
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'tab active' : 'tab'}
              onClick={() => {
                setMode('register')
                setError('')
              }}
            >
              Cadastro
            </button>
          </div>

          {mode === 'login' ? (
            <FormularioLogin
              error={error}
              loginForm={loginForm}
              onChange={updateLoginField}
              onForgotPassword={() => {
                setMode('forgotPassword')
                setForgotPasswordForm((current) => ({
                  ...current,
                  email: current.email || loginForm.email,
                }))
                setError('')
                setSuccess('')
              }}
              onSubmit={handleLogin}
              success={success}
              submitting={submitting}
            />
          ) : mode === 'register' ? (
            <FormularioCadastro
              error={error}
              onChange={updateRegisterField}
              onSubmit={handleRegister}
              registerForm={registerForm}
              success={success}
              submitting={submitting}
            />
          ) : (
            <FormularioRecuperacaoSenha
              error={error}
              forgotForm={forgotPasswordForm}
              onBackToLogin={voltarParaLogin}
              onForgotChange={updateForgotPasswordField}
              onForgotSubmit={handleForgotPassword}
              onResetChange={updateResetPasswordField}
              onResetSubmit={handleResetPassword}
              resetForm={resetPasswordForm}
              resetToken={resetPasswordToken}
              submitting={submitting}
              success={success}
            />
          )}
        </>
      </section>

      {registrationNoticeOpen ? (
        <div className="auth-modal-backdrop" role="presentation">
          <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="registration-notice-title">
            <h2 id="registration-notice-title">Verifique seu email</h2>
            <p>
              Enviamos um email de confirmacao para <strong>{verificationEmail}</strong>. Voce precisa confirmar esse
              email antes do primeiro login.
            </p>
            <p className="auth-modal-footer">
              Nao recebeu?
              {' '}
              <button
                className="auth-text-link"
                type="button"
                onClick={() => void handleResendVerification(verificationEmail)}
                disabled={submitting}
              >
                Reenviar email
              </button>
            </p>
            {error ? <p className="form-error">{error}</p> : null}
            {success ? <p className="form-success">{success}</p> : null}
            <div className="auth-modal-actions">
              <button className="primary-button" type="button" onClick={() => setRegistrationNoticeOpen(false)}>
                Entendi
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
