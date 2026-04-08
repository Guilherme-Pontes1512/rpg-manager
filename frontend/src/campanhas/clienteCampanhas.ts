import type {
  CampanhaDetalhe,
  CampanhaFormulario,
  CampanhaMembro,
  CampanhaResumo,
} from './tiposCampanha'

type CampanhaPage = {
  content: CampanhaResumo[]
}

async function campanhaRequest<T>(token: string, path: string, init?: RequestInit): Promise<T> {
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

export async function listarCampanhas(token: string): Promise<CampanhaResumo[]> {
  const page = await campanhaRequest<CampanhaPage>(token, '/api/campanhas?page=0&size=50')
  return page.content
}

export function obterCampanha(token: string, campanhaId: number) {
  return campanhaRequest<CampanhaDetalhe>(token, `/api/campanhas/${campanhaId}`)
}

export function criarCampanha(token: string, input: CampanhaFormulario) {
  return campanhaRequest<CampanhaDetalhe>(token, '/api/campanhas', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function atualizarCampanha(token: string, campanhaId: number, input: CampanhaFormulario) {
  return campanhaRequest<CampanhaDetalhe>(token, `/api/campanhas/${campanhaId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function excluirCampanha(token: string, campanhaId: number) {
  return campanhaRequest<void>(token, `/api/campanhas/${campanhaId}`, {
    method: 'DELETE',
  })
}

export function adicionarPlayer(token: string, campanhaId: number, identificador: string) {
  return campanhaRequest<CampanhaMembro>(token, `/api/campanhas/${campanhaId}/membros/players`, {
    method: 'POST',
    body: JSON.stringify({ identificador }),
  })
}

export function removerPlayer(token: string, campanhaId: number, usuarioId: number) {
  return campanhaRequest<void>(token, `/api/campanhas/${campanhaId}/membros/${usuarioId}`, {
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
