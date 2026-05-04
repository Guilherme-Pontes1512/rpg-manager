import type { AcompanhamentoCampanha, CampanhaDocumento } from './tiposAcompanhamento'

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

export function enviarDocumentoCampanha(token: string, campanhaId: number, arquivo: File) {
  const body = new FormData()
  body.append('arquivo', arquivo)

  return acompanhamentoRequest<CampanhaDocumento>(token, `/api/campanhas/${campanhaId}/documentos`, {
    method: 'POST',
    body,
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
