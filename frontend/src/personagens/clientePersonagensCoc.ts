import type { PersonagemCoc } from './tiposPersonagemCoc'

async function personagemRequest<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export function listarPersonagensCoc(token: string, campanhaId?: number) {
  const query = campanhaId ? `?campanhaId=${campanhaId}` : ''
  return personagemRequest<PersonagemCoc[]>(token, `/api/personagens/coc${query}`)
}

export function criarPersonagemCoc(token: string, input: PersonagemCoc) {
  return personagemRequest<PersonagemCoc>(token, '/api/personagens/coc', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function atualizarPersonagemCoc(token: string, personagemId: number, input: PersonagemCoc) {
  return personagemRequest<PersonagemCoc>(token, `/api/personagens/coc/${personagemId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function excluirPersonagemCoc(token: string, personagemId: number) {
  return personagemRequest<void>(token, `/api/personagens/coc/${personagemId}`, {
    method: 'DELETE',
  })
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
