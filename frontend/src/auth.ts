export type AuthUser = {
  id: number
  username: string
  email: string
  emailVerificado: boolean
}

export type RegisterInput = {
  nome: string
  username: string
  email: string
  senha: string
  confirmarSenha: string
}

export type AuthAction = {
  message: string
}

const AUTH_STORAGE_KEY = 'rpg-manager-auth'

function encodeBasic(email: string, senha: string) {
  return btoa(`${email}:${senha}`)
}

function authHeader(token: string) {
  return { Authorization: `Basic ${token}` }
}

export function getStoredToken() {
  return window.localStorage.getItem(AUTH_STORAGE_KEY)
}

export function clearStoredToken() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}

export async function getCurrentUser(token: string): Promise<AuthUser> {
  const response = await fetch('/api/auth/me', {
    headers: authHeader(token),
  })

  if (!response.ok) {
    throw new Error('Nao foi possivel validar a sessao.')
  }

  return response.json()
}

export async function login(email: string, senha: string) {
  const token = encodeBasic(email, senha)
  const user = await getCurrentUser(token)
  window.localStorage.setItem(AUTH_STORAGE_KEY, token)
  return { token, user }
}

export async function register(input: RegisterInput): Promise<AuthUser> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await readError(response)
    throw new Error(error)
  }

  return response.json()
}

export async function verifyEmail(token: string): Promise<AuthUser> {
  const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)

  if (!response.ok) {
    const error = await readError(response)
    throw new Error(error)
  }

  return response.json()
}

export async function resendVerificationEmail(email: string): Promise<AuthAction> {
  const response = await fetch('/api/auth/resend-verification', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })

  if (!response.ok) {
    const error = await readError(response)
    throw new Error(error)
  }

  return response.json()
}

export async function forgotPassword(email: string): Promise<AuthAction> {
  const response = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })

  if (!response.ok) {
    const error = await readError(response)
    throw new Error(error)
  }

  return response.json()
}

export async function resetPassword(token: string, senha: string, confirmarSenha: string): Promise<AuthAction> {
  const response = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, senha, confirmarSenha }),
  })

  if (!response.ok) {
    const error = await readError(response)
    throw new Error(error)
  }

  return response.json()
}

async function readError(response: Response) {
  try {
    const body = await response.json()
    if (body.fields) {
      const fieldMessage = Object.values<string>(body.fields)[0]
      if (fieldMessage) {
        return fieldMessage
      }
    }

    if (body.message) {
      return body.message
    }
  } catch {
    return 'Nao foi possivel concluir a requisicao.'
  }

  return 'Nao foi possivel concluir a requisicao.'
}
