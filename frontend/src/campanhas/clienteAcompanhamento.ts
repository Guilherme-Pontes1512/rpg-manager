import type { AcompanhamentoCampanha, CampanhaDocumento, CampanhaNpc } from './tiposAcompanhamento'

async function acompanhamentoRequest<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Authorization: `Basic ${token}`,
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

export function obterAcompanhamentoCampanha(token: string, campanhaId: number) {
  return acompanhamentoRequest<AcompanhamentoCampanha>(token, `/api/campanhas/${campanhaId}/acompanhamento`)
}

export function acompanharAcompanhamentoCampanhaTempoReal(
  token: string,
  campanhaId: number,
  onFichaAtualizada: () => void,
  onError: (error: unknown) => void,
) {
  const controller = new AbortController()

  void (async () => {
    try {
      const response = await fetch(`/api/campanhas/${campanhaId}/acompanhamento/stream`, {
        headers: {
          Accept: 'text/event-stream',
          Authorization: `Basic ${token}`,
        },
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(await readError(response))
      }

      if (!response.body) {
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (!controller.signal.aborted) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() ?? ''

        events.forEach((eventText) => {
          if (eventText.includes('event:character-sheet-updated')) {
            onFichaAtualizada()
          }
        })
      }
    } catch (caughtError) {
      if (!controller.signal.aborted) {
        onError(caughtError)
      }
    }
  })()

  return controller
}

export function enviarDocumentoCampanha(token: string, campanhaId: number, arquivo: File) {
  const body = new FormData()
  body.append('arquivo', arquivo)

  return acompanhamentoRequest<CampanhaDocumento>(token, `/api/campanhas/${campanhaId}/documentos`, {
    method: 'POST',
    body,
  })
}

export function criarNpcCampanha(token: string, campanhaId: number, npc: CampanhaNpc) {
  return acompanhamentoRequest<CampanhaNpc>(token, `/api/campanhas/${campanhaId}/acompanhamento/npcs`, {
    method: 'POST',
    body: JSON.stringify(npc),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function atualizarNpcCampanha(token: string, campanhaId: number, npcId: number, npc: CampanhaNpc) {
  return acompanhamentoRequest<CampanhaNpc>(token, `/api/campanhas/${campanhaId}/acompanhamento/npcs/${npcId}`, {
    method: 'PUT',
    body: JSON.stringify(npc),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function excluirNpcCampanha(token: string, campanhaId: number, npcId: number) {
  return acompanhamentoRequest<void>(token, `/api/campanhas/${campanhaId}/acompanhamento/npcs/${npcId}`, {
    method: 'DELETE',
  })
}

export function listarNotificacoesDocumentos(token: string) {
  return acompanhamentoRequest<CampanhaDocumento[]>(token, '/api/campanhas/documentos/notificacoes')
}

export async function baixarDocumentoCampanha(token: string, documento: CampanhaDocumento) {
  const response = await fetch(`/api/campanhas/documentos/${documento.id}/download`, {
    headers: {
      Authorization: `Basic ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = documento.nomeArquivo
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
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
